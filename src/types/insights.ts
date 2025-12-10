/**
 * Insights and analytics data models
 */

import { Epic, ProcessedTicket, DayStatistic, MonthlyBugTrend } from './jira-data';

// Epic-related insights
export interface EpicInsights {
  topByTicketCount: Epic[];
  topByStoryPoints: Epic[];
}

// Ticket-related insights and statistics
export interface TicketInsights {
  mostSprintChanges: ProcessedTicket;
  longestDuration: ProcessedTicket | null;
  longestSummary: ProcessedTicket;
  shortestSummary: ProcessedTicket;
  busiestCreationDays: DayStatistic[];
  busiestClosureDays: DayStatistic[];
}

// Bug analysis insights
export interface BugInsights {
  // All bugs analysis
  allBugStats: {
    totalCreated: number;
    totalClosed: number;
    totalOpen: number;
    averageResolutionTime: number | null; // in days
  };
  // Escaped bugs analysis (subset of all bugs)
  escapedBugStats: {
    totalCreated: number;
    totalClosed: number;
    totalOpen: number;
    percentageOfAllBugs: number;
  };
  // Bug trends over time
  monthlyTrends: MonthlyBugTrend[];
  allBugMonthlyTrends: MonthlyBugTrend[];
  // Bug insights
  oldestOpenBug: ProcessedTicket | null;
  mostRecentBug: ProcessedTicket | null;
  bugsByStatus: { status: string; count: number }[];
}

// Achievement and milestone tracking
export interface Achievement {
  title: string;
  description: string;
  value: string;
  icon: string;
  category: 'milestone' | 'performance' | 'quality';
}

// Improvement areas and suggestions
export interface ImprovementArea {
  title: string;
  description: string;
  suggestion: string;
  severity: 'low' | 'medium' | 'high';
  category: 'process' | 'quality' | 'efficiency';
}

// Complete dashboard insights aggregation
export interface DashboardInsights {
  epic: EpicInsights;
  ticket: TicketInsights;
  bug: BugInsights;
  achievements: Achievement[];
  improvementAreas: ImprovementArea[];
  metadata: {
    generatedAt: Date;
    totalTickets: number;
    dateRange: {
      start: Date;
      end: Date;
    };
  };
}