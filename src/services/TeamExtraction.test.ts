/**
 * Tests for team extraction functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DataTransformationService } from './DataTransformationService';
import { RawJiraData, RawJiraTicket } from '../types/jira-data';

describe('Team Extraction', () => {
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

  describe('extractUniqueTeams', () => {
    it('should extract single team from tickets', () => {
      const rawData = createMockRawData([
        {
          key: 'PROJ-123',
          summary: 'Test ticket',
          issueType: 'Story',
          status: 'Done',
          team: 'Frontend Team',
          created: '2024-01-01T00:00:00.000Z',
          sprints: []
        },
        {
          key: 'PROJ-124',
          summary: 'Another ticket',
          issueType: 'Story',
          status: 'Done',
          team: 'Frontend Team',
          created: '2024-01-02T00:00:00.000Z',
          sprints: []
        }
      ]);

      const result = service.transformRawData(rawData);

      expect(result.teams).toEqual(['Frontend Team']);
    });

    it('should extract multiple teams from tickets', () => {
      const rawData = createMockRawData([
        {
          key: 'PROJ-123',
          summary: 'Test ticket',
          issueType: 'Story',
          status: 'Done',
          team: 'Frontend Team',
          created: '2024-01-01T00:00:00.000Z',
          sprints: []
        },
        {
          key: 'PROJ-124',
          summary: 'Another ticket',
          issueType: 'Story',
          status: 'Done',
          team: 'Backend Team',
          created: '2024-01-02T00:00:00.000Z',
          sprints: []
        },
        {
          key: 'PROJ-125',
          summary: 'Third ticket',
          issueType: 'Story',
          status: 'Done',
          team: 'Data Team',
          created: '2024-01-03T00:00:00.000Z',
          sprints: []
        }
      ]);

      const result = service.transformRawData(rawData);

      expect(result.teams).toEqual(['Backend Team', 'Data Team', 'Frontend Team']);
    });

    it('should handle comma-separated teams in single field', () => {
      const rawData = createMockRawData([
        {
          key: 'PROJ-123',
          summary: 'Test ticket',
          issueType: 'Story',
          status: 'Done',
          team: 'Frontend Team, Backend Team',
          created: '2024-01-01T00:00:00.000Z',
          sprints: []
        }
      ]);

      const result = service.transformRawData(rawData);

      expect(result.teams).toEqual(['Backend Team', 'Frontend Team']);
    });

    it('should handle empty and whitespace team values', () => {
      const rawData = createMockRawData([
        {
          key: 'PROJ-123',
          summary: 'Test ticket',
          issueType: 'Story',
          status: 'Done',
          team: '',
          created: '2024-01-01T00:00:00.000Z',
          sprints: []
        },
        {
          key: 'PROJ-124',
          summary: 'Another ticket',
          issueType: 'Story',
          status: 'Done',
          team: '   ',
          created: '2024-01-02T00:00:00.000Z',
          sprints: []
        },
        {
          key: 'PROJ-125',
          summary: 'Third ticket',
          issueType: 'Story',
          status: 'Done',
          team: 'Valid Team',
          created: '2024-01-03T00:00:00.000Z',
          sprints: []
        }
      ]);

      const result = service.transformRawData(rawData);

      expect(result.teams).toEqual(['Valid Team']);
    });

    it('should handle tickets without team field', () => {
      const rawData = createMockRawData([
        {
          key: 'PROJ-123',
          summary: 'Test ticket',
          issueType: 'Story',
          status: 'Done',
          created: '2024-01-01T00:00:00.000Z',
          sprints: []
        },
        {
          key: 'PROJ-124',
          summary: 'Another ticket',
          issueType: 'Story',
          status: 'Done',
          team: 'Frontend Team',
          created: '2024-01-02T00:00:00.000Z',
          sprints: []
        }
      ]);

      const result = service.transformRawData(rawData);

      expect(result.teams).toEqual(['Frontend Team']);
    });

    it('should return empty array when no teams are found', () => {
      const rawData = createMockRawData([
        {
          key: 'PROJ-123',
          summary: 'Test ticket',
          issueType: 'Story',
          status: 'Done',
          created: '2024-01-01T00:00:00.000Z',
          sprints: []
        }
      ]);

      const result = service.transformRawData(rawData);

      expect(result.teams).toEqual([]);
    });

    it('should sort teams alphabetically', () => {
      const rawData = createMockRawData([
        {
          key: 'PROJ-123',
          summary: 'Test ticket',
          issueType: 'Story',
          status: 'Done',
          team: 'Zebra Team',
          created: '2024-01-01T00:00:00.000Z',
          sprints: []
        },
        {
          key: 'PROJ-124',
          summary: 'Another ticket',
          issueType: 'Story',
          status: 'Done',
          team: 'Alpha Team',
          created: '2024-01-02T00:00:00.000Z',
          sprints: []
        },
        {
          key: 'PROJ-125',
          summary: 'Third ticket',
          issueType: 'Story',
          status: 'Done',
          team: 'Beta Team',
          created: '2024-01-03T00:00:00.000Z',
          sprints: []
        }
      ]);

      const result = service.transformRawData(rawData);

      expect(result.teams).toEqual(['Alpha Team', 'Beta Team', 'Zebra Team']);
    });
  });
});