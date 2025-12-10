/**
 * Tests for XLSX Parser Service
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as XLSX from 'xlsx';
import { XLSXParserService } from './XLSXParserService';

describe('XLSXParserService', () => {
  let service: XLSXParserService;

  beforeEach(() => {
    service = new XLSXParserService();
  });

  // Helper function to create mock XLSX file
  const createMockXLSXFile = (data: any[][]): File => {
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    
    const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
    return new File([buffer], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
  };

  describe('validateFileFormat', () => {
    it('should accept valid XLSX files', () => {
      const file = new File([''], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
      expect(service.validateFileFormat(file)).toBe(true);
    });

    it('should accept valid XLS files', () => {
      const file = new File([''], 'test.xls', {
        type: 'application/vnd.ms-excel'
      });
      
      expect(service.validateFileFormat(file)).toBe(true);
    });

    it('should accept valid CSV files', () => {
      const file = new File([''], 'test.csv', {
        type: 'text/csv'
      });
      
      expect(service.validateFileFormat(file)).toBe(true);
    });

    it('should reject non-supported files', () => {
      const file = new File([''], 'test.txt', {
        type: 'text/plain'
      });
      
      expect(service.validateFileFormat(file)).toBe(false);
    });

    it('should reject files without proper extension', () => {
      const file = new File([''], 'test.pdf', {
        type: 'application/pdf'
      });
      
      expect(service.validateFileFormat(file)).toBe(false);
    });

    it('should throw error for files exceeding size limit', () => {
      // Create a file larger than 50MB
      const largeContent = new Array(51 * 1024 * 1024).fill('a').join('');
      const file = new File([largeContent], 'large.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
      expect(() => service.validateFileFormat(file)).toThrow('File size exceeds maximum limit');
    });

    it('should return false for null/undefined files', () => {
      expect(service.validateFileFormat(null as any)).toBe(false);
      expect(service.validateFileFormat(undefined as any)).toBe(false);
    });
  });

  describe('parseFile', () => {
    it('should reject invalid file formats', async () => {
      const file = new File([''], 'test.txt', {
        type: 'text/plain'
      });
      
      await expect(service.parseFile(file)).rejects.toThrow('Invalid file format');
    });

    it('should handle empty files gracefully', async () => {
      const file = new File([''], 'empty.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
      await expect(service.parseFile(file)).rejects.toThrow();
    });

    it('should parse valid XLSX file with Jira data', async () => {
      const mockData = [
        // Header row
        ['Key', 'Summary', 'Issue Type', 'Status', 'Created', 'Story Points', 'Sprint'],
        // Data rows
        ['PROJ-123', 'Test ticket 1', 'Story', 'Done', '2024-01-01', '5', 'Sprint 1'],
        ['PROJ-124', 'Test ticket 2', 'Bug', 'In Progress', '2024-01-02', '3', 'Sprint 1,Sprint 2']
      ];

      const file = createMockXLSXFile(mockData);
      const result = await service.parseFile(file);

      expect(result).toBeDefined();
      expect(result.tickets).toHaveLength(2);
      expect(result.tickets[0]).toMatchObject({
        key: 'PROJ-123',
        summary: 'Test ticket 1',
        issueType: 'Story',
        status: 'Done',
        storyPoints: 5
      });
      expect(result.tickets[1]).toMatchObject({
        key: 'PROJ-124',
        summary: 'Test ticket 2',
        issueType: 'Bug',
        status: 'In Progress',
        storyPoints: 3
      });
      expect(result.metadata.projectKeys).toContain('PROJ');
    });

    it('should handle missing optional fields', async () => {
      const mockData = [
        ['Key', 'Summary', 'Issue Type', 'Status', 'Created'],
        ['PROJ-125', 'Minimal ticket', 'Task', 'Open', '2024-01-03']
      ];

      const file = createMockXLSXFile(mockData);
      const result = await service.parseFile(file);

      expect(result.tickets).toHaveLength(1);
      expect(result.tickets[0]).toMatchObject({
        key: 'PROJ-125',
        summary: 'Minimal ticket',
        issueType: 'Task',
        status: 'Open'
      });
      expect(result.tickets[0]?.storyPoints).toBeUndefined();
      expect(result.tickets[0]?.parent).toBeUndefined();
    });

    it('should handle sprint parsing correctly', async () => {
      const mockData = [
        ['Key', 'Summary', 'Issue Type', 'Status', 'Created', 'Sprint'],
        ['PROJ-126', 'Multi-sprint ticket', 'Story', 'Done', '2024-01-04', 'Sprint 1,Sprint 2,Sprint 3']
      ];

      const file = createMockXLSXFile(mockData);
      const result = await service.parseFile(file);

      expect(result.tickets[0]?.sprints).toEqual(['Sprint 1', 'Sprint 2', 'Sprint 3']);
    });

    it('should reject files without required columns', async () => {
      const mockData = [
        ['Some Column', 'Another Column'],
        ['Value 1', 'Value 2']
      ];

      const file = createMockXLSXFile(mockData);
      await expect(service.parseFile(file)).rejects.toThrow('Required columns not found');
    });

    it('should skip empty rows', async () => {
      const mockData = [
        ['Key', 'Summary', 'Issue Type', 'Status', 'Created'],
        ['PROJ-127', 'Valid ticket', 'Story', 'Done', '2024-01-05'],
        ['', '', '', '', ''], // Empty row
        ['PROJ-128', 'Another valid ticket', 'Bug', 'Open', '2024-01-06']
      ];

      const file = createMockXLSXFile(mockData);
      const result = await service.parseFile(file);

      expect(result.tickets).toHaveLength(2);
      expect(result.tickets[0]?.key).toBe('PROJ-127');
      expect(result.tickets[1]?.key).toBe('PROJ-128');
    });

    it('should parse valid CSV file with Jira data', async () => {
      const csvContent = `Key,Summary,Issue Type,Status,Created,Story Points,Sprint
PROJ-200,CSV Test Ticket 1,Story,Done,2024-01-01,5,Sprint 1
PROJ-201,"CSV Test Ticket 2, with comma",Bug,In Progress,2024-01-02,3,"Sprint 1,Sprint 2"`;

      const file = new File([csvContent], 'test.csv', {
        type: 'text/csv'
      });

      const result = await service.parseFile(file);

      expect(result).toBeDefined();
      expect(result.tickets).toHaveLength(2);
      expect(result.tickets[0]).toMatchObject({
        key: 'PROJ-200',
        summary: 'CSV Test Ticket 1',
        issueType: 'Story',
        status: 'Done',
        storyPoints: 5
      });
      expect(result.tickets[1]).toMatchObject({
        key: 'PROJ-201',
        summary: 'CSV Test Ticket 2, with comma',
        issueType: 'Bug',
        status: 'In Progress',
        storyPoints: 3
      });
      expect(result.metadata.projectKeys).toContain('PROJ');
    });

    it('should handle CSV with quoted fields containing commas', async () => {
      const csvContent = `Key,Summary,Issue Type,Status,Created
PROJ-202,"Complex, summary with ""quotes"" and commas",Story,Done,2024-01-01`;

      const file = new File([csvContent], 'test.csv', {
        type: 'text/csv'
      });

      const result = await service.parseFile(file);

      expect(result.tickets).toHaveLength(1);
      expect(result.tickets[0]?.summary).toBe('Complex, summary with "quotes" and commas');
    });

    it('should handle empty CSV file', async () => {
      const csvContent = '';

      const file = new File([csvContent], 'empty.csv', {
        type: 'text/csv'
      });

      await expect(service.parseFile(file)).rejects.toThrow('Failed to read CSV file content');
    });
  });
});