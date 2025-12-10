/**
 * Service interface definitions for data processing pipeline
 */

import { RawJiraData, ProcessedJiraData, ValidationResult } from './jira-data';
import { DashboardInsights, EpicInsights, TicketInsights, BugInsights, Achievement, ImprovementArea } from './insights';

// XLSX Parser Service interface
export interface XLSXParserService {
  parseFile(file: File): Promise<RawJiraData>;
  validateFileFormat(file: File): boolean;
}

// Data Transformation Service interface
export interface DataTransformationService {
  transformRawData(rawData: RawJiraData): ProcessedJiraData;
  validateDataIntegrity(data: RawJiraData): ValidationResult;
}

// Insights Engine interface
export interface InsightsEngine {
  generateAllInsights(data: ProcessedJiraData): DashboardInsights;
  generateEpicInsights(data: ProcessedJiraData): EpicInsights;
  generateTicketInsights(data: ProcessedJiraData): TicketInsights;
  generateBugInsights(data: ProcessedJiraData): BugInsights;
  generateAchievements(data: ProcessedJiraData): Achievement[];
  generateImprovementAreas(data: ProcessedJiraData): ImprovementArea[];
}

// File processing states and errors
export interface FileProcessingState {
  isProcessing: boolean;
  progress?: number;
  error?: string;
  stage?: 'parsing' | 'transforming' | 'analyzing' | 'complete';
}

// Component prop interfaces
export interface FileUploadProps {
  onFileSelected: (file: File) => void;
  isProcessing: boolean;
  error?: string;
}