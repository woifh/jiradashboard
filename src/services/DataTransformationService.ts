/**
 * Data Transformation Service for converting raw Jira data to processed format
 * Handles data cleaning, calculations, and aggregations
 */

import { 
  RawJiraData, 
  RawJiraTicket, 
  ProcessedJiraData, 
  ProcessedTicket, 
  Epic, 
  ValidationResult 
} from '../types/jira-data';
import { DataTransformationService as IDataTransformationService } from '../types/services';
import { DataValidator } from '../types/validation';

export class DataTransformationService implements IDataTransformationService {
  
  /**
   * Validates the integrity of raw Jira data before transformation
   */
  validateDataIntegrity(data: RawJiraData): ValidationResult {
    return DataValidator.validateRawData(data);
  }

  /**
   * Transforms raw Jira data into processed format with calculations and aggregations
   */
  transformRawData(rawData: RawJiraData): ProcessedJiraData {
    // Basic structure validation
    if (!rawData || !Array.isArray(rawData.tickets)) {
      throw new Error('Invalid data structure: missing tickets array');
    }

    // Transform tickets
    const processedTickets = this.transformTickets(rawData.tickets);
    
    // Build epic aggregations
    const epics = this.buildEpicAggregations(processedTickets, rawData.tickets);
    
    // Extract unique teams
    const teams = this.extractUniqueTeams(rawData.tickets);
    
    // Calculate date range
    const dateRange = this.calculateDateRange(processedTickets);

    return {
      tickets: processedTickets,
      epics,
      teams,
      dateRange
    };
  }

  /**
   * Transforms raw tickets into processed format with calculations
   */
  private transformTickets(rawTickets: RawJiraTicket[]): ProcessedTicket[] {
    const processedTickets: ProcessedTicket[] = [];

    for (const rawTicket of rawTickets) {
      try {
        const processedTicket = this.transformSingleTicket(rawTicket);
        if (processedTicket) {
          processedTickets.push(processedTicket);
        }
      } catch (error) {
        console.warn(`Skipping ticket ${rawTicket.key}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return processedTickets;
  }

  /**
   * Transforms a single raw ticket into processed format
   */
  private transformSingleTicket(rawTicket: RawJiraTicket): ProcessedTicket | null {
    // Skip tickets with missing required fields
    if (!rawTicket.key || !rawTicket.summary || !rawTicket.issueType || 
        !rawTicket.status || !rawTicket.created) {
      return null;
    }

    const createdDate = this.parseDate(rawTicket.created);
    if (!createdDate) {
      return null;
    }

    const resolvedDate = rawTicket.resolved ? this.parseDate(rawTicket.resolved) || undefined : undefined;
    const duration = this.calculateDuration(createdDate, resolvedDate);
    const sprintCount = this.calculateSprintCount(rawTicket.sprints);
    const isEscapedBug = this.isEscapedBug(rawTicket);
    const summaryLength = rawTicket.summary.length;
    const storyPoints = this.normalizeStoryPoints(rawTicket.storyPoints);

    const processedTicket: ProcessedTicket = {
      key: rawTicket.key,
      summary: rawTicket.summary,
      issueType: rawTicket.issueType,
      status: rawTicket.status,
      parentKey: rawTicket.parentKey,
      storyPoints,
      createdDate,
      resolvedDate: resolvedDate || undefined,
      duration,
      sprintCount,
      isEscapedBug,
      summaryLength
    };

    return processedTicket;
  }

  /**
   * Parses date strings into Date objects
   */
  private parseDate(dateString: string): Date | null {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return null;
      }
      return date;
    } catch {
      return null;
    }
  }

  /**
   * Calculates duration in days between created and resolved dates
   */
  private calculateDuration(createdDate: Date, resolvedDate?: Date): number | undefined {
    if (!resolvedDate) {
      return undefined;
    }

    const diffInMs = resolvedDate.getTime() - createdDate.getTime();
    const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
    
    // Ensure non-negative duration
    return Math.max(0, diffInDays);
  }

  /**
   * Calculates the number of sprints a ticket has been in
   */
  private calculateSprintCount(sprints: string[]): number {
    if (!Array.isArray(sprints)) {
      return 0;
    }
    
    // Filter out empty strings and duplicates
    const uniqueSprints = Array.from(new Set(
      sprints.filter(sprint => sprint && sprint.trim().length > 0)
    ));
    
    return uniqueSprints.length;
  }

  /**
   * Determines if a ticket is an escaped bug based on origin ticket type
   */
  private isEscapedBug(rawTicket: RawJiraTicket): boolean {
    // Check if it's a bug with an origin ticket type indicating it was found externally
    if (rawTicket.issueType?.toLowerCase() !== 'bug') {
      return false;
    }

    const originType = rawTicket.originTicketType?.toLowerCase();
    if (!originType) {
      return false;
    }

    // Common indicators of escaped bugs
    const escapedBugIndicators = [
      'regression testing',
      'uat',
      'user acceptance testing',
      'production',
      'customer',
      'external',
      'qa',
      'testing'
    ];

    return escapedBugIndicators.some(indicator => 
      originType.includes(indicator)
    );
  }

  /**
   * Normalizes story points to a consistent numeric value
   */
  private normalizeStoryPoints(storyPoints?: number): number {
    if (storyPoints === undefined || storyPoints === null || isNaN(storyPoints)) {
      return 0;
    }
    
    // Ensure non-negative story points
    return Math.max(0, storyPoints);
  }

  /**
   * Builds epic aggregations from processed tickets
   */
  private buildEpicAggregations(processedTickets: ProcessedTicket[], rawTickets: RawJiraTicket[]): Epic[] {
    const epicMap = new Map<string, Epic>();

    // Step 1: First identify all epic tickets and create the epic entries
    for (const ticket of processedTickets) {
      if (ticket.issueType.toLowerCase() === 'epic') {
        epicMap.set(ticket.key, {
          key: ticket.key,
          name: ticket.summary,
          ticketCount: 0,
          totalStoryPoints: 0,
          completedTickets: 0
        });
      }
    }

    // Step 2: Build epics from parentKey and parentSummary fields (ignore parent field)
    for (const rawTicket of rawTickets) {
      if (rawTicket.parentKey && rawTicket.parentSummary) {
        if (!epicMap.has(rawTicket.parentKey)) {
          epicMap.set(rawTicket.parentKey, {
            key: rawTicket.parentKey,
            name: rawTicket.parentSummary,
            ticketCount: 0,
            totalStoryPoints: 0,
            completedTickets: 0
          });
        }
      }
    }

    // Step 3: Aggregate ticket data for each epic using parentKey
    for (const ticket of processedTickets) {
      if (ticket.parentKey && epicMap.has(ticket.parentKey)) {
        const epic = epicMap.get(ticket.parentKey);
        if (epic) {
          epic.ticketCount++;
          epic.totalStoryPoints += ticket.storyPoints;
        
          // Count completed tickets (Done or Closed status)
          if (this.isTicketCompleted(ticket.status)) {
            epic.completedTickets++;
          }
        }
      }
    }

    // Filter out epics with no associated tickets and return as array
    return Array.from(epicMap.values()).filter(epic => epic.ticketCount > 0);
  }





  /**
   * Extracts unique team names from raw tickets
   */
  private extractUniqueTeams(rawTickets: RawJiraTicket[]): string[] {
    const teamSet = new Set<string>();
    
    for (const ticket of rawTickets) {
      if (ticket.team && ticket.team.trim()) {
        // Handle multiple teams separated by commas
        const teams = ticket.team.split(',').map(team => team.trim()).filter(team => team);
        teams.forEach(team => teamSet.add(team));
      }
    }
    
    return Array.from(teamSet).sort();
  }

  /**
   * Determines if a ticket is considered completed
   */
  private isTicketCompleted(status: string): boolean {
    const completedStatuses = ['done', 'closed', 'resolved'];
    return completedStatuses.includes(status.toLowerCase());
  }

  /**
   * Calculates the overall date range from processed tickets
   */
  private calculateDateRange(processedTickets: ProcessedTicket[]): { start: Date; end: Date } {
    if (processedTickets.length === 0) {
      const now = new Date();
      return { start: now, end: now };
    }

    let startDate = processedTickets[0]!.createdDate;
    let endDate = processedTickets[0]!.createdDate;

    for (const ticket of processedTickets) {
      // Check created date
      if (ticket.createdDate < startDate) {
        startDate = ticket.createdDate;
      }
      if (ticket.createdDate > endDate) {
        endDate = ticket.createdDate;
      }

      // Check resolved date if available
      if (ticket.resolvedDate) {
        if (ticket.resolvedDate < startDate) {
          startDate = ticket.resolvedDate;
        }
        if (ticket.resolvedDate > endDate) {
          endDate = ticket.resolvedDate;
        }
      }
    }

    return { start: startDate, end: endDate };
  }
}