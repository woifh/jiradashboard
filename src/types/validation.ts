/**
 * Validation schemas and utilities for input data structure
 */

import { ValidationResult } from './jira-data';

// Required fields for a valid Jira ticket
export const REQUIRED_TICKET_FIELDS = [
  'key',
  'summary', 
  'issueType',
  'status',
  'created'
] as const;

// Optional fields that may be present
export const OPTIONAL_TICKET_FIELDS = [
  'parent',
  'storyPoints',
  'resolved',
  'sprints',
  'originTicketType'
] as const;

// Valid issue types commonly found in Jira
export const VALID_ISSUE_TYPES = [
  'Story',
  'Bug',
  'Task',
  'Epic',
  'Sub-task',
  'Improvement',
  'New Feature'
] as const;

// Valid status values
export const VALID_STATUSES = [
  'To Do',
  'In Progress',
  'Done',
  'Closed',
  'Resolved',
  'Open',
  'Reopened',
  'In Review',
  'Testing'
] as const;

// Validation schema for raw Jira ticket
export interface TicketValidationSchema {
  key: {
    required: true;
    type: 'string';
    pattern: RegExp;
  };
  summary: {
    required: true;
    type: 'string';
    minLength: number;
  };
  issueType: {
    required: true;
    type: 'string';
    allowedValues: readonly string[];
  };
  status: {
    required: true;
    type: 'string';
    allowedValues: readonly string[];
  };
  created: {
    required: true;
    type: 'string';
    format: 'date';
  };
  storyPoints: {
    required: false;
    type: 'number';
    min: number;
  };
}

// Validation functions
export class DataValidator {
  private static readonly JIRA_KEY_PATTERN = /^[A-Z]+-\d+$/;
  
  static validateTicket(ticket: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    for (const field of REQUIRED_TICKET_FIELDS) {
      if (!ticket[field] || ticket[field] === '') {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate ticket key format
    if (ticket.key && !this.JIRA_KEY_PATTERN.test(ticket.key)) {
      errors.push(`Invalid ticket key format: ${ticket.key}`);
    }

    // Validate issue type
    if (ticket.issueType && !VALID_ISSUE_TYPES.includes(ticket.issueType)) {
      warnings.push(`Unknown issue type: ${ticket.issueType}`);
    }

    // Validate status
    if (ticket.status && !VALID_STATUSES.includes(ticket.status)) {
      warnings.push(`Unknown status: ${ticket.status}`);
    }

    // Validate story points
    if (ticket.storyPoints !== undefined) {
      const points = Number(ticket.storyPoints);
      if (isNaN(points) || points < 0) {
        errors.push(`Invalid story points value: ${ticket.storyPoints}`);
      }
    }

    // Validate dates
    if (ticket.created && isNaN(Date.parse(ticket.created))) {
      errors.push(`Invalid created date format: ${ticket.created}`);
    }

    if (ticket.resolved && isNaN(Date.parse(ticket.resolved))) {
      errors.push(`Invalid resolved date format: ${ticket.resolved}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  static validateRawData(data: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if data has required structure
    if (!data || typeof data !== 'object') {
      errors.push('Data must be an object');
      return { isValid: false, errors, warnings };
    }

    if (!Array.isArray(data.tickets)) {
      errors.push('Data must contain a tickets array');
      return { isValid: false, errors, warnings };
    }

    if (data.tickets.length === 0) {
      warnings.push('No tickets found in data');
    }

    // Validate metadata
    if (!data.metadata || typeof data.metadata !== 'object') {
      errors.push('Data must contain metadata object');
    } else {
      if (!data.metadata.exportDate) {
        warnings.push('Missing export date in metadata');
      }
      if (!Array.isArray(data.metadata.projectKeys)) {
        warnings.push('Missing or invalid project keys in metadata');
      }
    }

    // Validate each ticket
    let validTickets = 0;
    for (let i = 0; i < data.tickets.length; i++) {
      const ticketValidation = this.validateTicket(data.tickets[i]);
      if (!ticketValidation.isValid) {
        errors.push(`Ticket ${i}: ${ticketValidation.errors.join(', ')}`);
      } else {
        validTickets++;
      }
      warnings.push(...ticketValidation.warnings.map(w => `Ticket ${i}: ${w}`));
    }

    if (validTickets === 0 && data.tickets.length > 0) {
      errors.push('No valid tickets found in data');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}