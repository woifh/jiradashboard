/**
 * Tests for comprehensive bug analysis functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InsightsEngine } from './InsightsEngine';
import { ProcessedJiraData, ProcessedTicket } from '../types/jira-data';

describe('Comprehensive Bug Analysis', () => {
  let engine: InsightsEngine;

  beforeEach(() => {
    engine = new InsightsEngine();
  });

  const createMockProcessedData = (tickets: ProcessedTicket[]): ProcessedJiraData => ({
    tickets,
    epics: [],
    teams: [],
    dateRange: {
      start: new Date('2024-01-01'),
      end: new Date('2024-01-31')
    }
  });

  const createBugTicket = (
    key: string,
    status: string,
    isEscaped: boolean = false,
    createdDate: Date = new Date('2024-01-15'),
    resolvedDate?: Date
  ): ProcessedTicket => ({
    key,
    summary: `Bug ticket ${key}`,
    issueType: 'Bug',
    status,
    parentKey: undefined,
    storyPoints: 0,
    createdDate,
    resolvedDate,
    duration: resolvedDate ? Math.ceil((resolvedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)) : undefined,
    sprintCount: 1,
    isEscapedBug: isEscaped,
    summaryLength: 20
  });

  describe('All Bug Statistics', () => {
    it('should calculate comprehensive bug statistics', () => {
      const tickets = [
        createBugTicket('BUG-1', 'Done', false, new Date('2024-01-01'), new Date('2024-01-05')),
        createBugTicket('BUG-2', 'Open', false, new Date('2024-01-10')),
        createBugTicket('BUG-3', 'Done', true, new Date('2024-01-15'), new Date('2024-01-20')),
        createBugTicket('BUG-4', 'In Progress', true, new Date('2024-01-20')),
        // Non-bug ticket
        {
          key: 'STORY-1',
          summary: 'Story ticket',
          issueType: 'Story',
          status: 'Done',
          parentKey: undefined,
          storyPoints: 5,
          createdDate: new Date('2024-01-01'),
          resolvedDate: new Date('2024-01-05'),
          duration: 4,
          sprintCount: 1,
          isEscapedBug: false,
          summaryLength: 12
        }
      ];

      const data = createMockProcessedData(tickets);
      const insights = engine.generateBugInsights(data);

      expect(insights.allBugStats.totalCreated).toBe(4);
      expect(insights.allBugStats.totalClosed).toBe(2);
      expect(insights.allBugStats.totalOpen).toBe(2);
      expect(insights.allBugStats.averageResolutionTime).toBe(5); // (4 + 5) / 2 = 4.5, rounded to 5
    });

    it('should handle case with no bugs', () => {
      const tickets = [
        {
          key: 'STORY-1',
          summary: 'Story ticket',
          issueType: 'Story',
          status: 'Done',
          parentKey: undefined,
          storyPoints: 5,
          createdDate: new Date('2024-01-01'),
          resolvedDate: new Date('2024-01-05'),
          duration: 4,
          sprintCount: 1,
          isEscapedBug: false,
          summaryLength: 12
        }
      ];

      const data = createMockProcessedData(tickets);
      const insights = engine.generateBugInsights(data);

      expect(insights.allBugStats.totalCreated).toBe(0);
      expect(insights.allBugStats.totalClosed).toBe(0);
      expect(insights.allBugStats.totalOpen).toBe(0);
      expect(insights.allBugStats.averageResolutionTime).toBeNull();
    });
  });

  describe('Escaped Bug Statistics', () => {
    it('should calculate escaped bug statistics and percentage', () => {
      const tickets = [
        createBugTicket('BUG-1', 'Done', false),
        createBugTicket('BUG-2', 'Open', false),
        createBugTicket('BUG-3', 'Done', true),
        createBugTicket('BUG-4', 'In Progress', true),
        createBugTicket('BUG-5', 'Open', true)
      ];

      const data = createMockProcessedData(tickets);
      const insights = engine.generateBugInsights(data);

      expect(insights.escapedBugStats.totalCreated).toBe(3);
      expect(insights.escapedBugStats.totalClosed).toBe(1);
      expect(insights.escapedBugStats.totalOpen).toBe(2);
      expect(insights.escapedBugStats.percentageOfAllBugs).toBe(60); // 3/5 * 100 = 60%
    });

    it('should handle case with no escaped bugs', () => {
      const tickets = [
        createBugTicket('BUG-1', 'Done', false),
        createBugTicket('BUG-2', 'Open', false)
      ];

      const data = createMockProcessedData(tickets);
      const insights = engine.generateBugInsights(data);

      expect(insights.escapedBugStats.totalCreated).toBe(0);
      expect(insights.escapedBugStats.totalClosed).toBe(0);
      expect(insights.escapedBugStats.totalOpen).toBe(0);
      expect(insights.escapedBugStats.percentageOfAllBugs).toBe(0);
    });
  });

  describe('Bug Insights', () => {
    it('should find oldest open bug', () => {
      const tickets = [
        createBugTicket('BUG-1', 'Done', false, new Date('2024-01-01')),
        createBugTicket('BUG-2', 'Open', false, new Date('2024-01-05')),
        createBugTicket('BUG-3', 'Open', false, new Date('2024-01-10')),
        createBugTicket('BUG-4', 'In Progress', false, new Date('2024-01-03'))
      ];

      const data = createMockProcessedData(tickets);
      const insights = engine.generateBugInsights(data);

      expect(insights.oldestOpenBug?.key).toBe('BUG-4');
      expect(insights.oldestOpenBug?.createdDate).toEqual(new Date('2024-01-03'));
    });

    it('should find most recent bug', () => {
      const tickets = [
        createBugTicket('BUG-1', 'Done', false, new Date('2024-01-01')),
        createBugTicket('BUG-2', 'Open', false, new Date('2024-01-05')),
        createBugTicket('BUG-3', 'Open', false, new Date('2024-01-20')),
        createBugTicket('BUG-4', 'In Progress', false, new Date('2024-01-10'))
      ];

      const data = createMockProcessedData(tickets);
      const insights = engine.generateBugInsights(data);

      expect(insights.mostRecentBug?.key).toBe('BUG-3');
      expect(insights.mostRecentBug?.createdDate).toEqual(new Date('2024-01-20'));
    });

    it('should calculate bugs by status', () => {
      const tickets = [
        createBugTicket('BUG-1', 'Done', false),
        createBugTicket('BUG-2', 'Done', false),
        createBugTicket('BUG-3', 'Open', false),
        createBugTicket('BUG-4', 'In Progress', false),
        createBugTicket('BUG-5', 'In Progress', false),
        createBugTicket('BUG-6', 'In Progress', false)
      ];

      const data = createMockProcessedData(tickets);
      const insights = engine.generateBugInsights(data);

      expect(insights.bugsByStatus).toHaveLength(3);
      expect(insights.bugsByStatus[0]).toEqual({ status: 'In Progress', count: 3 });
      expect(insights.bugsByStatus[1]).toEqual({ status: 'Done', count: 2 });
      expect(insights.bugsByStatus[2]).toEqual({ status: 'Open', count: 1 });
    });

    it('should handle edge cases with null values', () => {
      const data = createMockProcessedData([]);
      const insights = engine.generateBugInsights(data);

      expect(insights.oldestOpenBug).toBeNull();
      expect(insights.mostRecentBug).toBeNull();
      expect(insights.bugsByStatus).toEqual([]);
    });
  });

  describe('Monthly Trends', () => {
    it('should generate separate trends for all bugs and escaped bugs', () => {
      const tickets = [
        createBugTicket('BUG-1', 'Done', false, new Date('2024-01-01'), new Date('2024-01-15')),
        createBugTicket('BUG-2', 'Open', true, new Date('2024-01-10')),
        createBugTicket('BUG-3', 'Done', true, new Date('2024-02-01'), new Date('2024-02-10'))
      ];

      const data = createMockProcessedData(tickets);
      const insights = engine.generateBugInsights(data);

      // All bugs trends should include all 3 bugs
      expect(insights.allBugMonthlyTrends.length).toBeGreaterThan(0);
      
      // Escaped bugs trends should only include 2 bugs
      expect(insights.monthlyTrends.length).toBeGreaterThan(0);
      
      // The trends should be different
      expect(insights.allBugMonthlyTrends).not.toEqual(insights.monthlyTrends);
    });
  });
});