/**
 * Tests for Insights Engine
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InsightsEngine } from './InsightsEngine';
import { ProcessedJiraData, ProcessedTicket, Epic } from '../types/jira-data';

describe('InsightsEngine', () => {
  let engine: InsightsEngine;

  beforeEach(() => {
    engine = new InsightsEngine();
  });

  const createMockProcessedData = (tickets: ProcessedTicket[], epics: Epic[] = []): ProcessedJiraData => ({
    tickets,
    epics,
    dateRange: {
      start: new Date('2024-01-01'),
      end: new Date('2024-01-31')
    }
  });

  describe('generateEpicInsights', () => {
    it('should rank epics by ticket count correctly', () => {
      const epics: Epic[] = [
        { key: 'EPIC-1', name: 'Epic 1', ticketCount: 5, totalStoryPoints: 20, completedTickets: 3 },
        { key: 'EPIC-2', name: 'Epic 2', ticketCount: 8, totalStoryPoints: 15, completedTickets: 5 },
        { key: 'EPIC-3', name: 'Epic 3', ticketCount: 3, totalStoryPoints: 25, completedTickets: 2 }
      ];

      const data = createMockProcessedData([], epics);
      const insights = engine.generateEpicInsights(data);

      expect(insights.topByTicketCount).toHaveLength(3);
      expect(insights.topByTicketCount[0]?.key).toBe('EPIC-2'); // 8 tickets
      expect(insights.topByTicketCount[1]?.key).toBe('EPIC-1'); // 5 tickets
      expect(insights.topByTicketCount[2]?.key).toBe('EPIC-3'); // 3 tickets
    });

    it('should rank epics by story points correctly', () => {
      const epics: Epic[] = [
        { key: 'EPIC-1', name: 'Epic 1', ticketCount: 5, totalStoryPoints: 20, completedTickets: 3 },
        { key: 'EPIC-2', name: 'Epic 2', ticketCount: 8, totalStoryPoints: 15, completedTickets: 5 },
        { key: 'EPIC-3', name: 'Epic 3', ticketCount: 3, totalStoryPoints: 25, completedTickets: 2 }
      ];

      const data = createMockProcessedData([], epics);
      const insights = engine.generateEpicInsights(data);

      expect(insights.topByStoryPoints).toHaveLength(3);
      expect(insights.topByStoryPoints[0]?.key).toBe('EPIC-3'); // 25 points
      expect(insights.topByStoryPoints[1]?.key).toBe('EPIC-1'); // 20 points
      expect(insights.topByStoryPoints[2]?.key).toBe('EPIC-2'); // 15 points
    });

    it('should handle tie-breaking alphabetically', () => {
      const epics: Epic[] = [
        { key: 'EPIC-Z', name: 'Epic Z', ticketCount: 5, totalStoryPoints: 20, completedTickets: 3 },
        { key: 'EPIC-A', name: 'Epic A', ticketCount: 5, totalStoryPoints: 20, completedTickets: 3 }
      ];

      const data = createMockProcessedData([], epics);
      const insights = engine.generateEpicInsights(data);

      expect(insights.topByTicketCount[0]?.key).toBe('EPIC-A'); // Alphabetically first
      expect(insights.topByStoryPoints[0]?.key).toBe('EPIC-A'); // Alphabetically first
    });
  });

  describe('generateTicketInsights', () => {
    it('should find ticket with most sprint changes', () => {
      const tickets: ProcessedTicket[] = [
        {
          key: 'PROJ-1',
          summary: 'Ticket 1',
          issueType: 'Story',
          status: 'Done',
          parent: undefined,
          storyPoints: 3,
          createdDate: new Date('2024-01-01'),
          resolvedDate: new Date('2024-01-03'),
          duration: 2,
          sprintCount: 2,
          isEscapedBug: false,
          summaryLength: 8
        },
        {
          key: 'PROJ-2',
          summary: 'Ticket 2',
          issueType: 'Story',
          status: 'Done',
          parent: undefined,
          storyPoints: 5,
          createdDate: new Date('2024-01-02'),
          resolvedDate: new Date('2024-01-06'),
          duration: 4,
          sprintCount: 4,
          isEscapedBug: false,
          summaryLength: 8
        }
      ];

      const data = createMockProcessedData(tickets);
      const insights = engine.generateTicketInsights(data);

      expect(insights.mostSprintChanges.key).toBe('PROJ-2');
      expect(insights.mostSprintChanges.sprintCount).toBe(4);
    });

    it('should find longest and shortest summary tickets', () => {
      const tickets: ProcessedTicket[] = [
        {
          key: 'PROJ-1',
          summary: 'Short',
          issueType: 'Story',
          status: 'Done',
          parent: undefined,
          storyPoints: 3,
          createdDate: new Date('2024-01-01'),
          resolvedDate: new Date('2024-01-02'),
          duration: 1,
          sprintCount: 1,
          isEscapedBug: false,
          summaryLength: 5
        },
        {
          key: 'PROJ-2',
          summary: 'This is a very long ticket summary with lots of details',
          issueType: 'Story',
          status: 'Done',
          parent: undefined,
          storyPoints: 5,
          createdDate: new Date('2024-01-02'),
          resolvedDate: new Date('2024-01-04'),
          duration: 2,
          sprintCount: 1,
          isEscapedBug: false,
          summaryLength: 55
        }
      ];

      const data = createMockProcessedData(tickets);
      const insights = engine.generateTicketInsights(data);

      expect(insights.longestSummary.key).toBe('PROJ-2');
      expect(insights.shortestSummary.key).toBe('PROJ-1');
    });

    it('should find longest duration ticket', () => {
      const tickets: ProcessedTicket[] = [
        {
          key: 'PROJ-1',
          summary: 'Quick ticket',
          issueType: 'Story',
          status: 'Done',
          parent: undefined,
          storyPoints: 3,
          createdDate: new Date('2024-01-01'),
          resolvedDate: new Date('2024-01-02'),
          duration: 1,
          sprintCount: 1,
          isEscapedBug: false,
          summaryLength: 12
        },
        {
          key: 'PROJ-2',
          summary: 'Slow ticket',
          issueType: 'Story',
          status: 'Done',
          parent: undefined,
          storyPoints: 5,
          createdDate: new Date('2024-01-01'),
          resolvedDate: new Date('2024-01-15'),
          duration: 14,
          sprintCount: 1,
          isEscapedBug: false,
          summaryLength: 11
        }
      ];

      const data = createMockProcessedData(tickets);
      const insights = engine.generateTicketInsights(data);

      expect(insights.longestDuration).not.toBeNull();
      expect(insights.longestDuration!.key).toBe('PROJ-2');
      expect(insights.longestDuration!.duration).toBe(14);
    });

    it('should find busiest creation and closure days', () => {
      const tickets: ProcessedTicket[] = [
        {
          key: 'PROJ-1',
          summary: 'Ticket 1',
          issueType: 'Story',
          status: 'Done',
          parent: undefined,
          storyPoints: 3,
          createdDate: new Date('2024-01-01T10:00:00Z'),
          resolvedDate: new Date('2024-01-05T10:00:00Z'),
          duration: 4,
          sprintCount: 1,
          isEscapedBug: false,
          summaryLength: 8
        },
        {
          key: 'PROJ-2',
          summary: 'Ticket 2',
          issueType: 'Story',
          status: 'Done',
          parent: undefined,
          storyPoints: 5,
          createdDate: new Date('2024-01-01T14:00:00Z'), // Same day as PROJ-1
          resolvedDate: new Date('2024-01-05T14:00:00Z'), // Same day as PROJ-1
          duration: 4,
          sprintCount: 1,
          isEscapedBug: false,
          summaryLength: 8
        },
        {
          key: 'PROJ-3',
          summary: 'Ticket 3',
          issueType: 'Story',
          status: 'Done',
          parent: undefined,
          storyPoints: 2,
          createdDate: new Date('2024-01-02T10:00:00Z'),
          resolvedDate: new Date('2024-01-06T10:00:00Z'),
          duration: 4,
          sprintCount: 1,
          isEscapedBug: false,
          summaryLength: 8
        }
      ];

      const data = createMockProcessedData(tickets);
      const insights = engine.generateTicketInsights(data);

      expect(insights.busiestCreationDays).toHaveLength(2);
      expect(insights.busiestCreationDays[0]?.count).toBe(2); // Jan 1st has 2 tickets
      expect(insights.busiestCreationDays[1]?.count).toBe(1); // Jan 2nd has 1 ticket

      expect(insights.busiestClosureDays).toHaveLength(2);
      expect(insights.busiestClosureDays[0]?.count).toBe(2); // Jan 5th has 2 closures
      expect(insights.busiestClosureDays[1]?.count).toBe(1); // Jan 6th has 1 closure
    });
  });

  describe('generateBugInsights', () => {
    it('should calculate escaped bug statistics', () => {
      const tickets: ProcessedTicket[] = [
        {
          key: 'PROJ-1',
          summary: 'Regular bug',
          issueType: 'Bug',
          status: 'Open',
          parent: undefined,
          storyPoints: 0,
          createdDate: new Date('2024-01-01'),
          resolvedDate: undefined,
          duration: undefined,
          sprintCount: 1,
          isEscapedBug: false,
          summaryLength: 11
        },
        {
          key: 'PROJ-2',
          summary: 'Escaped bug 1',
          issueType: 'Bug',
          status: 'Done',
          parent: undefined,
          storyPoints: 0,
          createdDate: new Date('2024-01-01'),
          resolvedDate: new Date('2024-01-05'),
          duration: 4,
          sprintCount: 1,
          isEscapedBug: true,
          summaryLength: 13
        },
        {
          key: 'PROJ-3',
          summary: 'Escaped bug 2',
          issueType: 'Bug',
          status: 'Open',
          parent: undefined,
          storyPoints: 0,
          createdDate: new Date('2024-01-02'),
          resolvedDate: undefined,
          duration: undefined,
          sprintCount: 1,
          isEscapedBug: true,
          summaryLength: 13
        }
      ];

      const data = createMockProcessedData(tickets);
      const insights = engine.generateBugInsights(data);

      expect(insights.escapedBugStats.totalCreated).toBe(2);
      expect(insights.escapedBugStats.totalClosed).toBe(1);
    });

    it('should calculate monthly bug trends', () => {
      const tickets: ProcessedTicket[] = [
        {
          key: 'PROJ-1',
          summary: 'Bug 1',
          issueType: 'Bug',
          status: 'Done',
          parent: undefined,
          storyPoints: 0,
          createdDate: new Date('2024-01-15'),
          resolvedDate: new Date('2024-01-20'),
          duration: 5,
          sprintCount: 1,
          isEscapedBug: true,
          summaryLength: 5
        },
        {
          key: 'PROJ-2',
          summary: 'Bug 2',
          issueType: 'Bug',
          status: 'Open',
          parent: undefined,
          storyPoints: 0,
          createdDate: new Date('2024-01-25'),
          resolvedDate: undefined,
          duration: undefined,
          sprintCount: 1,
          isEscapedBug: true,
          summaryLength: 5
        },
        {
          key: 'PROJ-3',
          summary: 'Bug 3',
          issueType: 'Bug',
          status: 'Done',
          parent: undefined,
          storyPoints: 0,
          createdDate: new Date('2024-02-01'),
          resolvedDate: new Date('2024-02-05'),
          duration: 4,
          sprintCount: 1,
          isEscapedBug: true,
          summaryLength: 5
        }
      ];

      const data = createMockProcessedData(tickets);
      const insights = engine.generateBugInsights(data);

      expect(insights.monthlyTrends).toHaveLength(2);
      
      const janTrend = insights.monthlyTrends.find(t => t.month === 'January');
      expect(janTrend?.created).toBe(2);
      expect(janTrend?.closed).toBe(1);
      expect(janTrend?.cumulativeOpen).toBe(1);

      const febTrend = insights.monthlyTrends.find(t => t.month === 'February');
      expect(febTrend?.created).toBe(1);
      expect(febTrend?.closed).toBe(1);
      expect(febTrend?.cumulativeOpen).toBe(1); // 1 + 1 - 1 = 1
    });
  });

  describe('generateAchievements', () => {
    it('should generate story points achievement', () => {
      const tickets: ProcessedTicket[] = [
        {
          key: 'PROJ-1',
          summary: 'Story 1',
          issueType: 'Story',
          status: 'Done',
          parent: undefined,
          storyPoints: 5,
          createdDate: new Date('2024-01-01'),
          resolvedDate: new Date('2024-01-05'),
          duration: 4,
          sprintCount: 1,
          isEscapedBug: false,
          summaryLength: 7
        },
        {
          key: 'PROJ-2',
          summary: 'Story 2',
          issueType: 'Story',
          status: 'Done',
          parent: undefined,
          storyPoints: 8,
          createdDate: new Date('2024-01-02'),
          resolvedDate: new Date('2024-01-06'),
          duration: 4,
          sprintCount: 1,
          isEscapedBug: false,
          summaryLength: 7
        }
      ];

      const data = createMockProcessedData(tickets);
      const achievements = engine.generateAchievements(data);

      const storyPointsAchievement = achievements.find(a => a.title === 'Story Points Delivered');
      expect(storyPointsAchievement).toBeDefined();
      expect(storyPointsAchievement?.value).toBe('13');
      expect(storyPointsAchievement?.category).toBe('performance');
    });

    it('should generate completed tickets achievement', () => {
      const tickets: ProcessedTicket[] = [
        {
          key: 'PROJ-1',
          summary: 'Story 1',
          issueType: 'Story',
          status: 'Done',
          parent: undefined,
          storyPoints: 5,
          createdDate: new Date('2024-01-01'),
          resolvedDate: new Date('2024-01-05'),
          duration: 4,
          sprintCount: 1,
          isEscapedBug: false,
          summaryLength: 7
        },
        {
          key: 'PROJ-2',
          summary: 'Story 2',
          issueType: 'Story',
          status: 'Open',
          parent: undefined,
          storyPoints: 8,
          createdDate: new Date('2024-01-02'),
          resolvedDate: undefined,
          duration: undefined,
          sprintCount: 1,
          isEscapedBug: false,
          summaryLength: 7
        }
      ];

      const data = createMockProcessedData(tickets);
      const achievements = engine.generateAchievements(data);

      const completedTicketsAchievement = achievements.find(a => a.title === 'Tickets Completed');
      expect(completedTicketsAchievement).toBeDefined();
      expect(completedTicketsAchievement?.value).toBe('1');
    });
  });

  describe('generateImprovementAreas', () => {
    it('should identify sprint stability issues', () => {
      const tickets: ProcessedTicket[] = [
        {
          key: 'PROJ-1',
          summary: 'Stable ticket',
          issueType: 'Story',
          status: 'Done',
          parent: undefined,
          storyPoints: 5,
          createdDate: new Date('2024-01-01'),
          resolvedDate: new Date('2024-01-05'),
          duration: 4,
          sprintCount: 2,
          isEscapedBug: false,
          summaryLength: 13
        },
        {
          key: 'PROJ-2',
          summary: 'Unstable ticket',
          issueType: 'Story',
          status: 'Done',
          parent: undefined,
          storyPoints: 8,
          createdDate: new Date('2024-01-02'),
          resolvedDate: new Date('2024-01-06'),
          duration: 4,
          sprintCount: 5, // High sprint count
          isEscapedBug: false,
          summaryLength: 15
        }
      ];

      const data = createMockProcessedData(tickets);
      const improvements = engine.generateImprovementAreas(data);

      const sprintStabilityImprovement = improvements.find(i => i.title === 'Sprint Stability');
      expect(sprintStabilityImprovement).toBeDefined();
      expect(sprintStabilityImprovement?.category).toBe('process');
    });

    it('should identify long duration issues', () => {
      const tickets: ProcessedTicket[] = [
        {
          key: 'PROJ-1',
          summary: 'Quick ticket',
          issueType: 'Story',
          status: 'Done',
          parent: undefined,
          storyPoints: 5,
          createdDate: new Date('2024-01-01'),
          resolvedDate: new Date('2024-01-05'),
          duration: 4,
          sprintCount: 1,
          isEscapedBug: false,
          summaryLength: 12
        },
        {
          key: 'PROJ-2',
          summary: 'Slow ticket',
          issueType: 'Story',
          status: 'Done',
          parent: undefined,
          storyPoints: 8,
          createdDate: new Date('2024-01-01'),
          resolvedDate: new Date('2024-02-15'),
          duration: 45, // Very long duration
          sprintCount: 1,
          isEscapedBug: false,
          summaryLength: 11
        }
      ];

      const data = createMockProcessedData(tickets);
      const improvements = engine.generateImprovementAreas(data);

      const durationImprovement = improvements.find(i => i.title === 'Ticket Duration');
      expect(durationImprovement).toBeDefined();
      expect(durationImprovement?.category).toBe('efficiency');
    });
  });

  describe('error handling', () => {
    it('should throw error when no tickets available for analysis', () => {
      const data = createMockProcessedData([]);
      
      expect(() => engine.generateTicketInsights(data)).toThrow('No tickets available for analysis');
    });

    it('should return null for longestDuration when no tickets with duration available', () => {
      const tickets: ProcessedTicket[] = [
        {
          key: 'PROJ-1',
          summary: 'Unresolved ticket',
          issueType: 'Story',
          status: 'Open',
          parent: undefined,
          storyPoints: 5,
          createdDate: new Date('2024-01-01'),
          resolvedDate: undefined,
          duration: undefined, // No duration
          sprintCount: 1,
          isEscapedBug: false,
          summaryLength: 16
        }
      ];

      const data = createMockProcessedData(tickets);
      
      const insights = engine.generateTicketInsights(data);
      expect(insights.longestDuration).toBeNull();
    });
  });
});