/**
 * Data transformation utilities for converting raw Jira data to processed format
 */

import { RawJiraTicket, RawJiraData, ProcessedTicket, ProcessedJiraData, Epic } from './jira-data';

export class DataTransformationUtils {
  /**
   * Parse date string to Date object with fallback handling
   */
  static parseDate(dateString: string): Date {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date format: ${dateString}`);
    }
    return date;
  }

  /**
   * Calculate duration in days between two dates
   */
  static calculateDuration(startDate: Date, endDate: Date): number {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Count unique sprints from sprint array
   */
  static countSprints(sprints: string[]): number {
    if (!Array.isArray(sprints)) return 0;
    return new Set(sprints.filter(sprint => sprint && sprint.trim())).size;
  }

  /**
   * Determine if ticket is an escaped bug based on origin type
   */
  static isEscapedBug(ticket: RawJiraTicket): boolean {
    return ticket.issueType?.toLowerCase() === 'bug' && 
           ticket.originTicketType !== undefined &&
           ticket.originTicketType !== null &&
           ticket.originTicketType.trim() !== '';
  }

  /**
   * Transform raw ticket to processed ticket
   */
  static transformTicket(rawTicket: RawJiraTicket): ProcessedTicket {
    const createdDate = this.parseDate(rawTicket.created);
    const resolvedDate = rawTicket.resolved ? this.parseDate(rawTicket.resolved) : undefined;
    
    return {
      key: rawTicket.key,
      summary: rawTicket.summary,
      issueType: rawTicket.issueType,
      status: rawTicket.status,
      parent: rawTicket.parent,
      storyPoints: rawTicket.storyPoints || 0,
      createdDate,
      resolvedDate,
      duration: resolvedDate ? this.calculateDuration(createdDate, resolvedDate) : undefined,
      sprintCount: this.countSprints(rawTicket.sprints),
      isEscapedBug: this.isEscapedBug(rawTicket),
      summaryLength: rawTicket.summary.length
    };
  }

  /**
   * Extract and build epic information from tickets
   */
  static buildEpics(tickets: ProcessedTicket[]): Epic[] {
    const epicMap = new Map<string, Epic>();

    // Find all epic tickets first
    tickets.filter(ticket => ticket.issueType.toLowerCase() === 'epic')
           .forEach(epicTicket => {
             epicMap.set(epicTicket.key, {
               key: epicTicket.key,
               name: epicTicket.summary,
               ticketCount: 0,
               totalStoryPoints: 0,
               completedTickets: 0
             });
           });

    // Count tickets and story points for each epic
    tickets.forEach(ticket => {
      if (ticket.parent && epicMap.has(ticket.parent)) {
        const epic = epicMap.get(ticket.parent)!;
        epic.ticketCount++;
        epic.totalStoryPoints += ticket.storyPoints;
        
        if (ticket.status.toLowerCase() === 'done' || ticket.status.toLowerCase() === 'closed') {
          epic.completedTickets++;
        }
      }
    });

    return Array.from(epicMap.values());
  }

  /**
   * Calculate date range from processed tickets
   */
  static calculateDateRange(tickets: ProcessedTicket[]): { start: Date; end: Date } {
    if (tickets.length === 0) {
      const now = new Date();
      return { start: now, end: now };
    }

    const dates = tickets.flatMap(ticket => {
      const dates = [ticket.createdDate];
      if (ticket.resolvedDate) {
        dates.push(ticket.resolvedDate);
      }
      return dates;
    });

    const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime());
    
    return {
      start: sortedDates[0]!,
      end: sortedDates[sortedDates.length - 1]!
    };
  }

  /**
   * Transform raw Jira data to processed format
   */
  static transformRawData(rawData: RawJiraData): ProcessedJiraData {
    const processedTickets = rawData.tickets.map(ticket => this.transformTicket(ticket));
    const epics = this.buildEpics(processedTickets);
    const dateRange = this.calculateDateRange(processedTickets);

    return {
      tickets: processedTickets,
      epics,
      dateRange
    };
  }

  /**
   * Sanitize and normalize string values
   */
  static sanitizeString(value: any): string {
    if (typeof value !== 'string') {
      return String(value || '');
    }
    return value.trim();
  }

  /**
   * Normalize story points value
   */
  static normalizeStoryPoints(value: any): number {
    if (value === null || value === undefined || value === '') {
      return 0;
    }
    
    const points = Number(value);
    return isNaN(points) || points < 0 ? 0 : points;
  }

  /**
   * Parse and normalize sprint data
   */
  static normalizeSprints(sprints: any): string[] {
    if (!sprints) return [];
    
    if (typeof sprints === 'string') {
      // Handle comma-separated sprint names
      return sprints.split(',').map(s => s.trim()).filter(s => s.length > 0);
    }
    
    if (Array.isArray(sprints)) {
      return sprints.map(s => String(s).trim()).filter(s => s.length > 0);
    }
    
    return [];
  }
}