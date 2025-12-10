/**
 * Tests for Data Transformation Service
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DataTransformationService } from './DataTransformationService';
import { RawJiraData, RawJiraTicket } from '../types/jira-data';

describe('DataTransformationService', () => {
  let service: DataTransformationService;

  beforeEach(() => {
    service = new DataTransformationService();
  });

  const createMockRawData = (tickets: RawJiraTicket[]): RawJiraData => ({
    tickets,
    metadata: {
      exportDate: '2024-01-01T00:00:00.000Z',
      projectKeys: ['PROJ']
    }
  });

  describe('validateDataIntegrity', () => {
    it('should validate correct data structure', () => {
      const rawData = createMockRawData([
        {
          key: 'PROJ-123',
          summary: 'Test ticket',
          issueType: 'Story',
          status: 'Done',
          created: '2024-01-01T00:00:00.000Z',
          sprints: ['Sprint 1']
        }
      ]);

      const result = service.validateDataIntegrity(rawData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid data structure', () => {
      const invalidData = {
        tickets: [
          {
            key: '', // Invalid empty key
            summary: 'Test ticket',
            issueType: 'Story',
            status: 'Done',
            created: '2024-01-01T00:00:00.000Z',
            sprints: []
          }
        ],
        metadata: {
          exportDate: '2024-01-01T00:00:00.000Z',
          projectKeys: ['PROJ']
        }
      } as RawJiraData;

      const result = service.validateDataIntegrity(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('transformRawData', () => {
    it('should transform valid raw data to processed format', () => {
      const rawData = createMockRawData([
        {
          key: 'PROJ-123',
          summary: 'Test story',
          issueType: 'Story',
          status: 'Done',
          created: '2024-01-01T00:00:00.000Z',
          resolved: '2024-01-05T00:00:00.000Z',
          storyPoints: 5,
          sprints: ['Sprint 1', 'Sprint 2']
        },
        {
          key: 'PROJ-124',
          summary: 'Test bug',
          issueType: 'Bug',
          status: 'Open',
          created: '2024-01-02T00:00:00.000Z',
          originTicketType: 'UAT',
          sprints: ['Sprint 1']
        }
      ]);

      const result = service.transformRawData(rawData);

      expect(result.tickets).toHaveLength(2);
      expect(result.tickets[0]).toMatchObject({
        key: 'PROJ-123',
        summary: 'Test story',
        issueType: 'Story',
        status: 'Done',
        storyPoints: 5,
        sprintCount: 2,
        duration: 4, // 4 days between Jan 1 and Jan 5
        summaryLength: 10
      });

      expect(result.tickets[1]).toMatchObject({
        key: 'PROJ-124',
        summary: 'Test bug',
        issueType: 'Bug',
        status: 'Open',
        storyPoints: 0, // Default value
        sprintCount: 1,
        isEscapedBug: true, // UAT origin indicates escaped bug
        summaryLength: 8
      });

      expect(result.dateRange.start).toBeInstanceOf(Date);
      expect(result.dateRange.end).toBeInstanceOf(Date);
    });

    it('should handle epic aggregations correctly', () => {
      const rawData = createMockRawData([
        {
          key: 'PROJ-100',
          summary: 'Epic ticket',
          issueType: 'Epic',
          status: 'In Progress',
          created: '2024-01-01T00:00:00.000Z',
          sprints: []
        },
        {
          key: 'PROJ-101',
          summary: 'Story under epic',
          issueType: 'Story',
          status: 'Done',
          parent: 'PROJ-100',
          storyPoints: 3,
          created: '2024-01-02T00:00:00.000Z',
          sprints: ['Sprint 1']
        },
        {
          key: 'PROJ-102',
          summary: 'Another story under epic',
          issueType: 'Story',
          status: 'Done',
          parent: 'PROJ-100',
          storyPoints: 5,
          created: '2024-01-03T00:00:00.000Z',
          sprints: ['Sprint 1']
        }
      ]);

      const result = service.transformRawData(rawData);

      expect(result.epics).toHaveLength(1);
      expect(result.epics[0]).toMatchObject({
        key: 'PROJ-100',
        name: 'Epic ticket',
        ticketCount: 2,
        totalStoryPoints: 8,
        completedTickets: 2
      });
    });

    it('should calculate durations correctly', () => {
      const rawData = createMockRawData([
        {
          key: 'PROJ-125',
          summary: 'Quick ticket',
          issueType: 'Task',
          status: 'Done',
          created: '2024-01-01T09:00:00.000Z',
          resolved: '2024-01-01T17:00:00.000Z', // Same day
          sprints: []
        },
        {
          key: 'PROJ-126',
          summary: 'Long ticket',
          issueType: 'Story',
          status: 'Done',
          created: '2024-01-01T00:00:00.000Z',
          resolved: '2024-01-10T00:00:00.000Z', // 9 days
          sprints: []
        },
        {
          key: 'PROJ-127',
          summary: 'Unresolved ticket',
          issueType: 'Bug',
          status: 'Open',
          created: '2024-01-01T00:00:00.000Z',
          // No resolved date
          sprints: []
        }
      ]);

      const result = service.transformRawData(rawData);

      expect(result.tickets[0]?.duration).toBe(1); // Same day = 1 day
      expect(result.tickets[1]?.duration).toBe(9); // 9 days
      expect(result.tickets[2]?.duration).toBeUndefined(); // No resolved date
    });

    it('should identify escaped bugs correctly', () => {
      const rawData = createMockRawData([
        {
          key: 'PROJ-128',
          summary: 'Regular bug',
          issueType: 'Bug',
          status: 'Open',
          created: '2024-01-01T00:00:00.000Z',
          sprints: []
        },
        {
          key: 'PROJ-129',
          summary: 'UAT found bug',
          issueType: 'Bug',
          status: 'Open',
          created: '2024-01-01T00:00:00.000Z',
          originTicketType: 'UAT',
          sprints: []
        },
        {
          key: 'PROJ-130',
          summary: 'Production bug',
          issueType: 'Bug',
          status: 'Open',
          created: '2024-01-01T00:00:00.000Z',
          originTicketType: 'Production',
          sprints: []
        },
        {
          key: 'PROJ-131',
          summary: 'Story with origin',
          issueType: 'Story',
          status: 'Done',
          created: '2024-01-01T00:00:00.000Z',
          originTicketType: 'UAT', // Not a bug, so not escaped
          sprints: []
        }
      ]);

      const result = service.transformRawData(rawData);

      expect(result.tickets[0]?.isEscapedBug).toBe(false); // Regular bug
      expect(result.tickets[1]?.isEscapedBug).toBe(true);  // UAT bug
      expect(result.tickets[2]?.isEscapedBug).toBe(true);  // Production bug
      expect(result.tickets[3]?.isEscapedBug).toBe(false); // Not a bug
    });

    it('should handle sprint counting correctly', () => {
      const rawData = createMockRawData([
        {
          key: 'PROJ-132',
          summary: 'No sprints',
          issueType: 'Story',
          status: 'Open',
          created: '2024-01-01T00:00:00.000Z',
          sprints: []
        },
        {
          key: 'PROJ-133',
          summary: 'Single sprint',
          issueType: 'Story',
          status: 'Done',
          created: '2024-01-01T00:00:00.000Z',
          sprints: ['Sprint 1']
        },
        {
          key: 'PROJ-134',
          summary: 'Multiple sprints',
          issueType: 'Story',
          status: 'Done',
          created: '2024-01-01T00:00:00.000Z',
          sprints: ['Sprint 1', 'Sprint 2', 'Sprint 1'] // Duplicate should be counted once
        }
      ]);

      const result = service.transformRawData(rawData);

      expect(result.tickets[0]?.sprintCount).toBe(0);
      expect(result.tickets[1]?.sprintCount).toBe(1);
      expect(result.tickets[2]?.sprintCount).toBe(2); // Duplicates removed
    });

    it('should filter out incomplete tickets', () => {
      const rawData = createMockRawData([
        {
          key: 'PROJ-135',
          summary: 'Valid ticket',
          issueType: 'Story',
          status: 'Done',
          created: '2024-01-01T00:00:00.000Z',
          sprints: []
        },
        {
          key: '', // Invalid - empty key
          summary: 'Invalid ticket',
          issueType: 'Story',
          status: 'Done',
          created: '2024-01-01T00:00:00.000Z',
          sprints: []
        },
        {
          key: 'PROJ-136',
          summary: '', // Invalid - empty summary
          issueType: 'Story',
          status: 'Done',
          created: '2024-01-01T00:00:00.000Z',
          sprints: []
        }
      ]);

      const result = service.transformRawData(rawData);

      expect(result.tickets).toHaveLength(1); // Only valid ticket should remain
      expect(result.tickets[0]?.key).toBe('PROJ-135');
    });
  });
});