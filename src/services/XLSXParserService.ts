/**
 * XLSX Parser Service for processing Jira export files
 * Handles file validation, parsing, and data extraction
 */

import * as XLSX from 'xlsx';
import { RawJiraData, RawJiraTicket } from '../types/jira-data';
import { XLSXParserService as IXLSXParserService } from '../types/services';
import { DataValidator } from '../types/validation';

export class XLSXParserService implements IXLSXParserService {
  private static readonly SUPPORTED_EXTENSIONS = ['.xlsx', '.xls'];
  private static readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  
  // Common column mappings for Jira exports
  private static readonly COLUMN_MAPPINGS = {
    key: ['key', 'issue key', 'ticket key', 'id'],
    summary: ['summary', 'title', 'description'],
    issueType: ['issue type', 'type', 'issuetype'],
    status: ['status', 'state'],
    parent: ['parent', 'epic link', 'epic', 'parent key'],
    storyPoints: ['story points', 'points', 'estimate', 'story point estimate'],
    created: ['created', 'creation date', 'date created'],
    resolved: ['resolved', 'resolution date', 'date resolved', 'closed'],
    sprints: ['sprint', 'sprints', 'sprint name'],
    originTicketType: ['origin ticket type', 'origin type', 'original type']
  };

  /**
   * Validates if the file is a supported XLSX format
   */
  validateFileFormat(file: File): boolean {
    if (!file) {
      return false;
    }

    // Check file size
    if (file.size > XLSXParserService.MAX_FILE_SIZE) {
      throw new Error(`File size exceeds maximum limit of ${XLSXParserService.MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }

    // Check file extension
    const fileName = file.name.toLowerCase();
    const hasValidExtension = XLSXParserService.SUPPORTED_EXTENSIONS.some(ext => 
      fileName.endsWith(ext)
    );

    if (!hasValidExtension) {
      return false;
    }

    // Check MIME type
    const validMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/octet-stream' // Some browsers report this for .xlsx files
    ];

    return validMimeTypes.includes(file.type) || file.type === '';
  }

  /**
   * Parses an XLSX file and extracts Jira ticket data
   */
  async parseFile(file: File): Promise<RawJiraData> {
    if (!this.validateFileFormat(file)) {
      throw new Error('Invalid file format. Please upload a valid XLSX file.');
    }

    try {
      const arrayBuffer = await this.readFileAsArrayBuffer(file);
      const workbook = XLSX.read(arrayBuffer, { 
        type: 'array',
        cellDates: true,
        dateNF: 'yyyy-mm-dd'
      });

      // Get the first worksheet
      const worksheetName = workbook.SheetNames[0];
      if (!worksheetName) {
        throw new Error('No worksheets found in the file');
      }

      const worksheet = workbook.Sheets[worksheetName];
      if (!worksheet) {
        throw new Error('Worksheet not found');
      }
      
      const rawData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: '',
        raw: false
      }) as any[][];

      if (rawData.length === 0) {
        throw new Error('No data found in the worksheet');
      }

      // Parse the data into structured format
      const tickets = this.parseTicketsFromRows(rawData);
      const metadata = this.extractMetadata(tickets);

      const result: RawJiraData = {
        tickets,
        metadata
      };

      // Validate the parsed data
      const validation = DataValidator.validateRawData(result);
      if (!validation.isValid) {
        throw new Error(`Data validation failed: ${validation.errors.join(', ')}`);
      }

      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to parse XLSX file: ${error.message}`);
      }
      throw new Error('Failed to parse XLSX file: Unknown error occurred');
    }
  }

  /**
   * Reads file as ArrayBuffer for XLSX processing
   */
  private readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target?.result instanceof ArrayBuffer) {
          resolve(event.target.result);
        } else {
          reject(new Error('Failed to read file as ArrayBuffer'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('File reading failed'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Parses ticket data from worksheet rows
   */
  private parseTicketsFromRows(rows: any[][]): RawJiraTicket[] {
    if (rows.length < 2) {
      throw new Error('File must contain at least a header row and one data row');
    }

    const headerRow = rows[0];
    if (!headerRow) {
      throw new Error('No header row found');
    }
    
    const headers = headerRow.map((header: any) => 
      String(header).toLowerCase().trim()
    );
    
    const columnMap = this.createColumnMapping(headers);
    const tickets: RawJiraTicket[] = [];

    // Process data rows (skip header)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || this.isEmptyRow(row)) {
        continue;
      }

      try {
        const ticket = this.parseTicketFromRow(row, columnMap);
        if (ticket) {
          tickets.push(ticket);
        }
      } catch (error) {
        console.warn(`Skipping row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    if (tickets.length === 0) {
      throw new Error('No valid tickets found in the file');
    }

    return tickets;
  }

  /**
   * Creates a mapping from column indices to ticket fields
   */
  private createColumnMapping(headers: string[]): Record<string, number> {
    const mapping: Record<string, number> = {};

    for (const [field, possibleNames] of Object.entries(XLSXParserService.COLUMN_MAPPINGS)) {
      const columnIndex = headers.findIndex(header => 
        possibleNames.some(name => header.includes(name))
      );
      
      if (columnIndex !== -1) {
        mapping[field] = columnIndex;
      }
    }

    // Ensure required fields are present
    const requiredFields = ['key', 'summary', 'issueType', 'status', 'created'];
    const missingFields = requiredFields.filter(field => !(field in mapping));
    
    if (missingFields.length > 0) {
      throw new Error(`Required columns not found: ${missingFields.join(', ')}`);
    }

    return mapping;
  }

  /**
   * Parses a single ticket from a row
   */
  private parseTicketFromRow(row: any[], columnMap: Record<string, number>): RawJiraTicket | null {
    if (!row || row.length === 0) {
      return null;
    }
    
    const getValue = (field: string): any => {
      const index = columnMap[field];
      return index !== undefined && index < row.length ? row[index] : undefined;
    };

    // Extract basic fields
    const key = this.parseString(getValue('key'));
    const summary = this.parseString(getValue('summary'));
    const issueType = this.parseString(getValue('issueType'));
    const status = this.parseString(getValue('status'));
    const created = this.parseDate(getValue('created'));

    // Skip if required fields are missing
    if (!key || !summary || !issueType || !status || !created) {
      return null;
    }

    // Extract optional fields
    const parent = this.parseString(getValue('parent'));
    const storyPoints = this.parseNumber(getValue('storyPoints'));
    const resolved = this.parseDate(getValue('resolved'));
    const sprints = this.parseSprints(getValue('sprints'));
    const originTicketType = this.parseString(getValue('originTicketType'));

    const ticket: RawJiraTicket = {
      key,
      summary,
      issueType,
      status,
      created,
      sprints
    };

    // Add optional properties only if they have values
    if (parent) ticket.parent = parent;
    if (storyPoints !== undefined) ticket.storyPoints = storyPoints;
    if (resolved) ticket.resolved = resolved;
    if (originTicketType) ticket.originTicketType = originTicketType;

    return ticket;
  }

  /**
   * Parses a string value, handling various formats
   */
  private parseString(value: any): string | undefined {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }
    return String(value).trim();
  }

  /**
   * Parses a numeric value, handling various formats
   */
  private parseNumber(value: any): number | undefined {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }
    
    const num = Number(value);
    return isNaN(num) ? undefined : num;
  }

  /**
   * Parses date values, handling various Excel date formats
   */
  private parseDate(value: any): string | undefined {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }

    // If it's already a Date object (from XLSX parsing)
    if (value instanceof Date) {
      return value.toISOString();
    }

    // If it's a string, try to parse it
    if (typeof value === 'string') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    }

    // If it's a number (Excel serial date)
    if (typeof value === 'number') {
      try {
        const date = XLSX.SSF.parse_date_code(value);
        if (date) {
          return new Date(date.y, date.m - 1, date.d).toISOString();
        }
      } catch (error) {
        // Fall back to treating as timestamp
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      }
    }

    return undefined;
  }

  /**
   * Parses sprint information, handling various formats
   */
  private parseSprints(value: any): string[] {
    if (value === null || value === undefined || value === '') {
      return [];
    }

    const sprintStr = String(value);
    
    // Handle comma-separated sprints
    if (sprintStr.includes(',')) {
      return sprintStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
    }
    
    // Handle semicolon-separated sprints
    if (sprintStr.includes(';')) {
      return sprintStr.split(';').map(s => s.trim()).filter(s => s.length > 0);
    }
    
    // Handle pipe-separated sprints
    if (sprintStr.includes('|')) {
      return sprintStr.split('|').map(s => s.trim()).filter(s => s.length > 0);
    }
    
    // Single sprint or complex format - extract sprint names
    const sprintMatches = sprintStr.match(/name=([^,\]]+)/g);
    if (sprintMatches) {
      return sprintMatches.map(match => match.replace('name=', '').trim());
    }
    
    // Fallback: treat as single sprint
    return [sprintStr.trim()];
  }

  /**
   * Checks if a row is empty or contains only empty values
   */
  private isEmptyRow(row: any[]): boolean {
    return row.every(cell => 
      cell === null || 
      cell === undefined || 
      String(cell).trim() === ''
    );
  }

  /**
   * Extracts metadata from parsed tickets
   */
  private extractMetadata(tickets: RawJiraTicket[]): RawJiraData['metadata'] {
    const projectKeys = Array.from(new Set(
      tickets
        .map(ticket => ticket.key?.split('-')[0])
        .filter((key): key is string => key !== undefined && key.length > 0)
    )).sort();

    return {
      exportDate: new Date().toISOString(),
      projectKeys
    };
  }
}