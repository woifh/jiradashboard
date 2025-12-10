/**
 * Insights Engine for generating analytics and insights from processed Jira data
 * Handles epic rankings, ticket analysis, and statistical calculations
 */

import { 
  ProcessedJiraData, 
  ProcessedTicket, 
  Epic, 
  DayStatistic 
} from '../types/jira-data';
import { 
  DashboardInsights, 
  EpicInsights, 
  TicketInsights, 
  BugInsights, 
  Achievement, 
  ImprovementArea 
} from '../types/insights';
import { InsightsEngine as IInsightsEngine } from '../types/services';

export class InsightsEngine implements IInsightsEngine {

  /**
   * Generates all insights from processed data
   */
  generateAllInsights(data: ProcessedJiraData): DashboardInsights {
    const epicInsights = this.generateEpicInsights(data);
    const ticketInsights = this.generateTicketInsights(data);
    const bugInsights = this.generateBugInsights(data);
    const achievements = this.generateAchievements(data);
    const improvementAreas = this.generateImprovementAreas(data);

    return {
      epic: epicInsights,
      ticket: ticketInsights,
      bug: bugInsights,
      achievements,
      improvementAreas,
      metadata: {
        generatedAt: new Date(),
        totalTickets: data.tickets.length,
        dateRange: data.dateRange
      }
    };
  }

  /**
   * Generates epic-related insights including rankings
   */
  generateEpicInsights(data: ProcessedJiraData): EpicInsights {
    const topByTicketCount = this.rankEpicsByTicketCount(data.epics);
    const topByStoryPoints = this.rankEpicsByStoryPoints(data.epics);

    return {
      topByTicketCount,
      topByStoryPoints
    };
  }

  /**
   * Generates ticket-related insights and statistics
   */
  generateTicketInsights(data: ProcessedJiraData): TicketInsights {
    if (data.tickets.length === 0) {
      throw new Error('No tickets available for analysis');
    }

    const mostSprintChanges = this.findTicketWithMostSprintChanges(data.tickets);
    const longestDuration = this.findLongestDurationTicket(data.tickets);
    const longestSummary = this.findLongestSummaryTicket(data.tickets);
    const shortestSummary = this.findShortestSummaryTicket(data.tickets);
    const busiestCreationDays = this.findBusiestCreationDays(data.tickets);
    const busiestClosureDays = this.findBusiestClosureDays(data.tickets);

    return {
      mostSprintChanges,
      longestDuration,
      longestSummary,
      shortestSummary,
      busiestCreationDays,
      busiestClosureDays
    };
  }

  /**
   * Generates comprehensive bug analysis insights
   */
  generateBugInsights(data: ProcessedJiraData): BugInsights {
    // Filter all bugs (any ticket with issue type 'Bug')
    const allBugs = data.tickets.filter(ticket => 
      ticket.issueType.toLowerCase() === 'bug'
    );
    
    // Filter escaped bugs (bugs with origin ticket type)
    const escapedBugs = data.tickets.filter(ticket => ticket.isEscapedBug);
    
    // Calculate all bugs statistics
    const allBugsClosed = allBugs.filter(bug => this.isTicketClosed(bug.status));
    const allBugsOpen = allBugs.filter(bug => !this.isTicketClosed(bug.status));
    
    const allBugStats = {
      totalCreated: allBugs.length,
      totalClosed: allBugsClosed.length,
      totalOpen: allBugsOpen.length,
      averageResolutionTime: this.calculateAverageResolutionTime(allBugsClosed)
    };

    // Calculate escaped bugs statistics
    const escapedBugsClosed = escapedBugs.filter(bug => this.isTicketClosed(bug.status));
    const escapedBugsOpen = escapedBugs.filter(bug => !this.isTicketClosed(bug.status));
    
    const escapedBugStats = {
      totalCreated: escapedBugs.length,
      totalClosed: escapedBugsClosed.length,
      totalOpen: escapedBugsOpen.length,
      percentageOfAllBugs: allBugs.length > 0 ? Math.round((escapedBugs.length / allBugs.length) * 100) : 0
    };

    // Calculate monthly trends for both escaped and all bugs
    const monthlyTrends = this.calculateMonthlyBugTrends(escapedBugs);
    const allBugMonthlyTrends = this.calculateMonthlyBugTrends(allBugs);

    // Find oldest open bug and most recent bug
    const oldestOpenBug = this.findOldestOpenBug(allBugsOpen);
    const mostRecentBug = this.findMostRecentBug(allBugs);

    // Calculate bugs by status
    const bugsByStatus = this.calculateBugsByStatus(allBugs);

    return {
      allBugStats,
      escapedBugStats,
      monthlyTrends,
      allBugMonthlyTrends,
      oldestOpenBug,
      mostRecentBug,
      bugsByStatus
    };
  }

  /**
   * Generates achievement highlights
   */
  generateAchievements(data: ProcessedJiraData): Achievement[] {
    const achievements: Achievement[] = [];

    // Story points achievement
    const totalStoryPoints = data.tickets.reduce((sum, ticket) => sum + ticket.storyPoints, 0);
    if (totalStoryPoints > 0) {
      achievements.push({
        title: 'Story Points Delivered',
        description: `Team delivered ${totalStoryPoints} story points across all completed work`,
        value: totalStoryPoints.toString(),
        icon: '🎯',
        category: 'performance'
      });
    }

    // Epic completion achievement
    const completedEpics = data.epics.filter(epic => 
      epic.completedTickets === epic.ticketCount && epic.ticketCount > 0
    );
    if (completedEpics.length > 0) {
      achievements.push({
        title: 'Epics Completed',
        description: `Successfully completed ${completedEpics.length} epic${completedEpics.length > 1 ? 's' : ''}`,
        value: completedEpics.length.toString(),
        icon: '🏆',
        category: 'milestone'
      });
    }

    // Ticket velocity achievement
    const completedTickets = data.tickets.filter(ticket => this.isTicketClosed(ticket.status));
    if (completedTickets.length > 0) {
      achievements.push({
        title: 'Tickets Completed',
        description: `Closed ${completedTickets.length} tickets during this period`,
        value: completedTickets.length.toString(),
        icon: '✅',
        category: 'performance'
      });
    }

    // Quality achievement (low escaped bug ratio)
    const totalBugs = data.tickets.filter(ticket => ticket.issueType.toLowerCase() === 'bug').length;
    const escapedBugs = data.tickets.filter(ticket => ticket.isEscapedBug).length;
    if (totalBugs > 0) {
      const escapedBugRatio = (escapedBugs / totalBugs) * 100;
      if (escapedBugRatio < 20) { // Less than 20% escaped bugs is good
        achievements.push({
          title: 'Quality Focus',
          description: `Only ${escapedBugRatio.toFixed(1)}% of bugs were found externally`,
          value: `${(100 - escapedBugRatio).toFixed(1)}%`,
          icon: '🛡️',
          category: 'quality'
        });
      }
    }

    return achievements;
  }

  /**
   * Generates improvement area suggestions
   */
  generateImprovementAreas(data: ProcessedJiraData): ImprovementArea[] {
    const improvements: ImprovementArea[] = [];

    // Check for tickets with excessive sprint changes
    const highSprintChangeTickets = data.tickets.filter(ticket => ticket.sprintCount > 3);
    if (highSprintChangeTickets.length > 0) {
      const percentage = (highSprintChangeTickets.length / data.tickets.length) * 100;
      improvements.push({
        title: 'Sprint Stability',
        description: `${highSprintChangeTickets.length} tickets (${percentage.toFixed(1)}%) moved across more than 3 sprints`,
        suggestion: 'Consider improving sprint planning and scope definition to reduce ticket movement',
        severity: percentage > 15 ? 'high' : percentage > 8 ? 'medium' : 'low',
        category: 'process'
      });
    }

    // Check for tickets with very long durations
    const longDurationTickets = data.tickets.filter(ticket => 
      ticket.duration !== undefined && ticket.duration > 30
    );
    if (longDurationTickets.length > 0) {
      const percentage = (longDurationTickets.length / data.tickets.length) * 100;
      improvements.push({
        title: 'Ticket Duration',
        description: `${longDurationTickets.length} tickets (${percentage.toFixed(1)}%) took more than 30 days to complete`,
        suggestion: 'Consider breaking down large tickets or identifying blockers that cause delays',
        severity: percentage > 20 ? 'high' : percentage > 10 ? 'medium' : 'low',
        category: 'efficiency'
      });
    }

    // Check escaped bug ratio
    const totalBugs = data.tickets.filter(ticket => ticket.issueType.toLowerCase() === 'bug').length;
    const escapedBugs = data.tickets.filter(ticket => ticket.isEscapedBug).length;
    if (totalBugs > 0) {
      const escapedBugRatio = (escapedBugs / totalBugs) * 100;
      if (escapedBugRatio > 30) {
        improvements.push({
          title: 'Bug Detection',
          description: `${escapedBugRatio.toFixed(1)}% of bugs were found externally (UAT, production, etc.)`,
          suggestion: 'Consider strengthening testing processes and code review practices',
          severity: escapedBugRatio > 50 ? 'high' : 'medium',
          category: 'quality'
        });
      }
    }

    return improvements;
  }

  /**
   * Ranks epics by ticket count (top 3)
   */
  private rankEpicsByTicketCount(epics: Epic[]): Epic[] {
    return [...epics]
      .sort((a, b) => {
        // Primary sort: ticket count (descending)
        if (b.ticketCount !== a.ticketCount) {
          return b.ticketCount - a.ticketCount;
        }
        // Tie-breaker: alphabetical by key
        return a.key.localeCompare(b.key);
      })
      .slice(0, 3);
  }

  /**
   * Ranks epics by story points (top 3)
   */
  private rankEpicsByStoryPoints(epics: Epic[]): Epic[] {
    return [...epics]
      .sort((a, b) => {
        // Primary sort: story points (descending)
        if (b.totalStoryPoints !== a.totalStoryPoints) {
          return b.totalStoryPoints - a.totalStoryPoints;
        }
        // Tie-breaker: alphabetical by key
        return a.key.localeCompare(b.key);
      })
      .slice(0, 3);
  }

  /**
   * Finds the ticket with the most sprint changes
   */
  private findTicketWithMostSprintChanges(tickets: ProcessedTicket[]): ProcessedTicket {
    if (tickets.length === 0) {
      throw new Error('No tickets available for analysis');
    }

    return tickets.reduce((max, current) => {
      if (current.sprintCount > max.sprintCount) {
        return current;
      }
      if (current.sprintCount === max.sprintCount) {
        // Tie-breaker: alphabetical by key
        return current.key.localeCompare(max.key || '') < 0 ? current : max;
      }
      return max;
    });
  }

  /**
   * Finds the ticket with the longest duration
   */
  private findLongestDurationTicket(tickets: ProcessedTicket[]): ProcessedTicket | null {
    const ticketsWithDuration = tickets.filter(ticket => ticket.duration !== undefined);
    
    if (ticketsWithDuration.length === 0) {
      return null; // Return null instead of throwing error
    }

    return ticketsWithDuration.reduce((max, current) => {
      const maxDuration = max.duration || 0;
      const currentDuration = current.duration || 0;
      
      if (currentDuration > maxDuration) {
        return current;
      }
      if (currentDuration === maxDuration) {
        // Tie-breaker: alphabetical by key
        return current.key.localeCompare(max.key || '') < 0 ? current : max;
      }
      return max;
    });
  }

  /**
   * Finds the ticket with the longest summary
   */
  private findLongestSummaryTicket(tickets: ProcessedTicket[]): ProcessedTicket {
    if (tickets.length === 0) {
      throw new Error('No tickets available for analysis');
    }

    return tickets.reduce((max, current) => {
      if (current.summaryLength > max.summaryLength) {
        return current;
      }
      if (current.summaryLength === max.summaryLength) {
        // Tie-breaker: alphabetical by key
        return current.key.localeCompare(max.key || '') < 0 ? current : max;
      }
      return max;
    });
  }

  /**
   * Finds the ticket with the shortest summary
   */
  private findShortestSummaryTicket(tickets: ProcessedTicket[]): ProcessedTicket {
    if (tickets.length === 0) {
      throw new Error('No tickets available for analysis');
    }

    return tickets.reduce((min, current) => {
      if (current.summaryLength < min.summaryLength) {
        return current;
      }
      if (current.summaryLength === min.summaryLength) {
        // Tie-breaker: alphabetical by key
        return current.key.localeCompare(min.key || '') < 0 ? current : min;
      }
      return min;
    });
  }

  /**
   * Finds the busiest ticket creation days
   */
  private findBusiestCreationDays(tickets: ProcessedTicket[]): DayStatistic[] {
    const dayCount = new Map<string, number>();

    for (const ticket of tickets) {
      const dateKey = ticket.createdDate.toISOString().split('T')[0]!; // YYYY-MM-DD
      dayCount.set(dateKey, (dayCount.get(dateKey) || 0) + 1);
    }

    const dayStats: DayStatistic[] = Array.from(dayCount.entries()).map(([dateStr, count]) => ({
      date: new Date(dateStr),
      count
    }));

    return dayStats
      .sort((a, b) => {
        // Primary sort: count (descending)
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        // Tie-breaker: most recent date first
        return b.date.getTime() - a.date.getTime();
      })
      .slice(0, 5); // Top 5 busiest days
  }

  /**
   * Finds the busiest ticket closure days
   */
  private findBusiestClosureDays(tickets: ProcessedTicket[]): DayStatistic[] {
    const ticketsWithResolution = tickets.filter(ticket => ticket.resolvedDate);
    const dayCount = new Map<string, number>();

    for (const ticket of ticketsWithResolution) {
      if (ticket.resolvedDate) {
        const dateKey = ticket.resolvedDate.toISOString().split('T')[0]!; // YYYY-MM-DD
        dayCount.set(dateKey, (dayCount.get(dateKey) || 0) + 1);
      }
    }

    const dayStats: DayStatistic[] = Array.from(dayCount.entries()).map(([dateStr, count]) => ({
      date: new Date(dateStr),
      count
    }));

    return dayStats
      .sort((a, b) => {
        // Primary sort: count (descending)
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        // Tie-breaker: most recent date first
        return b.date.getTime() - a.date.getTime();
      })
      .slice(0, 5); // Top 5 busiest days
  }

  /**
   * Calculates monthly bug trends for the provided bug tickets
   */
  private calculateMonthlyBugTrends(bugs: ProcessedTicket[]) {
    const monthlyData = new Map<string, { created: number; closed: number }>();

    // Count created bugs by month
    for (const bug of bugs) {
      const monthKey = this.getMonthKey(bug.createdDate);
      const data = monthlyData.get(monthKey) || { created: 0, closed: 0 };
      data.created++;
      monthlyData.set(monthKey, data);
    }

    // Count closed bugs by month
    for (const bug of bugs) {
      if (bug.resolvedDate) {
        const monthKey = this.getMonthKey(bug.resolvedDate);
        const data = monthlyData.get(monthKey) || { created: 0, closed: 0 };
        data.closed++;
        monthlyData.set(monthKey, data);
      }
    }

    // Convert to array and calculate cumulative
    const sortedMonths = Array.from(monthlyData.keys()).sort();
    let cumulativeOpen = 0;

    return sortedMonths.map(monthKey => {
      const parts = monthKey.split('-');
      const year = parseInt(parts[0]!, 10);
      const month = parseInt(parts[1]!, 10);
      const data = monthlyData.get(monthKey)!;
      
      cumulativeOpen += data.created - data.closed;

      return {
        month: new Date(year, month - 1).toLocaleString('default', { month: 'long' }),
        year: year,
        created: data.created,
        closed: data.closed,
        cumulativeOpen: Math.max(0, cumulativeOpen) // Ensure non-negative
      };
    });
  }

  /**
   * Gets month key in YYYY-MM format
   */
  private getMonthKey(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
  }

  /**
   * Checks if a ticket is considered closed
   */
  private isTicketClosed(status: string): boolean {
    const closedStatuses = ['done', 'closed', 'resolved'];
    return closedStatuses.includes(status.toLowerCase());
  }

  /**
   * Calculates average resolution time for closed bugs
   */
  private calculateAverageResolutionTime(closedBugs: ProcessedTicket[]): number | null {
    const bugsWithDuration = closedBugs.filter(bug => bug.duration !== undefined);
    
    if (bugsWithDuration.length === 0) {
      return null;
    }

    const totalDuration = bugsWithDuration.reduce((sum, bug) => sum + (bug.duration || 0), 0);
    return Math.round(totalDuration / bugsWithDuration.length);
  }

  /**
   * Finds the oldest open bug
   */
  private findOldestOpenBug(openBugs: ProcessedTicket[]): ProcessedTicket | null {
    if (openBugs.length === 0) {
      return null;
    }

    return openBugs.reduce((oldest, current) => {
      if (current.createdDate < oldest.createdDate) {
        return current;
      }
      if (current.createdDate.getTime() === oldest.createdDate.getTime()) {
        // Tie-breaker: alphabetical by key
        return current.key.localeCompare(oldest.key) < 0 ? current : oldest;
      }
      return oldest;
    });
  }

  /**
   * Finds the most recently created bug
   */
  private findMostRecentBug(bugs: ProcessedTicket[]): ProcessedTicket | null {
    if (bugs.length === 0) {
      return null;
    }

    return bugs.reduce((newest, current) => {
      if (current.createdDate > newest.createdDate) {
        return current;
      }
      if (current.createdDate.getTime() === newest.createdDate.getTime()) {
        // Tie-breaker: alphabetical by key
        return current.key.localeCompare(newest.key) < 0 ? current : newest;
      }
      return newest;
    });
  }

  /**
   * Calculates bug distribution by status
   */
  private calculateBugsByStatus(bugs: ProcessedTicket[]): { status: string; count: number }[] {
    const statusCount = new Map<string, number>();

    bugs.forEach(bug => {
      const status = bug.status;
      statusCount.set(status, (statusCount.get(status) || 0) + 1);
    });

    return Array.from(statusCount.entries())
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count); // Sort by count descending
  }
}