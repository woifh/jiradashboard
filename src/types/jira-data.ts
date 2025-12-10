/**
 * Core Jira data models for raw and processed ticket data
 */

// Raw data models from XLSX import
export interface RawJiraTicket {
  key: string;
  summary: string;
  issueType: string;
  status: string;
  parent?: string;
  parentKey?: string;
  parentSummary?: string;
  team?: string;
  storyPoints?: number;
  created: string;
  resolved?: string;
  sprints: string[];
  originTicketType?: string;
}

export interface RawJiraData {
  tickets: RawJiraTicket[];
  metadata: {
    exportDate: string;
    projectKeys: string[];
  };
}

// Processed data models after transformation
export interface ProcessedTicket {
  key: string;
  summary: string;
  issueType: string;
  status: string;
  parentKey: string | undefined;
  storyPoints: number;
  createdDate: Date;
  resolvedDate: Date | undefined;
  duration: number | undefined; // days
  sprintCount: number;
  isEscapedBug: boolean;
  summaryLength: number;
}

export interface Epic {
  key: string;
  name: string;
  ticketCount: number;
  totalStoryPoints: number;
  completedTickets: number;
}

export interface ProcessedJiraData {
  tickets: ProcessedTicket[];
  epics: Epic[];
  teams: string[];
  dateRange: {
    start: Date;
    end: Date;
  };
}

// Validation result types
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Daily statistics for creation and closure patterns
export interface DayStatistic {
  date: Date;
  count: number;
}

// Monthly bug trend data
export interface MonthlyBugTrend {
  month: string;
  year: number;
  created: number;
  closed: number;
  cumulativeOpen: number;
}