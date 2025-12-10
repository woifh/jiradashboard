/**
 * Web Worker for heavy data processing operations
 * Handles XLSX parsing and data transformation off the main thread
 */

// Import the XLSX library (will be loaded from CDN in production)
importScripts('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');

// Message handler for processing requests
self.onmessage = function(e) {
  const { type, data, id } = e.data;

  try {
    switch (type) {
      case 'PARSE_XLSX':
        handleFileParsing(data, id);
        break;
      case 'TRANSFORM_DATA':
        handleDataTransformation(data, id);
        break;
      default:
        postMessage({
          id,
          type: 'ERROR',
          error: `Unknown message type: ${type}`
        });
    }
  } catch (error) {
    postMessage({
      id,
      type: 'ERROR',
      error: error.message || 'Unknown error occurred'
    });
  }
};

function handleFileParsing(fileData, id) {
  // Update progress
  postMessage({ id, type: 'PROGRESS', progress: 10, stage: 'parsing' });

  let rawData;
  
  // Check if it's CSV data (string) or XLSX data (ArrayBuffer)
  if (typeof fileData === 'string') {
    // Handle CSV data
    rawData = parseCSVText(fileData);
  } else {
    // Handle XLSX data
    const workbook = XLSX.read(fileData, { 
      type: 'array',
      cellDates: true,
      dateNF: 'yyyy-mm-dd'
    });

    postMessage({ id, type: 'PROGRESS', progress: 30, stage: 'parsing' });

    // Get the first worksheet
    const worksheetName = workbook.SheetNames[0];
    if (!worksheetName) {
      throw new Error('No worksheets found in the file');
    }

    const worksheet = workbook.Sheets[worksheetName];
    rawData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,
      defval: '',
      raw: false
    });
  }

  postMessage({ id, type: 'PROGRESS', progress: 60, stage: 'parsing' });

  if (rawData.length === 0) {
    throw new Error('No data found in the file');
  }

  // Process the raw data into structured format
  const tickets = parseTicketsFromRows(rawData);
  const metadata = extractMetadata(tickets);

  postMessage({ id, type: 'PROGRESS', progress: 90, stage: 'parsing' });

  const result = {
    tickets,
    metadata
  };

  postMessage({
    id,
    type: 'PARSE_XLSX_COMPLETE',
    data: result
  });
}

function handleDataTransformation(rawData, id) {
  postMessage({ id, type: 'PROGRESS', progress: 10, stage: 'transforming' });

  // Transform tickets
  const processedTickets = transformTickets(rawData.tickets);
  
  postMessage({ id, type: 'PROGRESS', progress: 50, stage: 'transforming' });
  
  // Build epic aggregations
  const epics = buildEpicAggregations(processedTickets, rawData.tickets);
  
  postMessage({ id, type: 'PROGRESS', progress: 80, stage: 'transforming' });
  
  // Calculate date range
  const dateRange = calculateDateRange(processedTickets);

  const result = {
    tickets: processedTickets,
    epics,
    dateRange
  };

  postMessage({
    id,
    type: 'TRANSFORM_DATA_COMPLETE',
    data: result
  });
}

// Helper functions (simplified versions of the main thread implementations)
function parseTicketsFromRows(rows) {
  if (rows.length < 2) {
    throw new Error('File must contain at least a header row and one data row');
  }

  const headers = rows[0].map(header => String(header).toLowerCase().trim());
  const columnMap = createColumnMapping(headers);
  const tickets = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (isEmptyRow(row)) continue;

    try {
      const ticket = parseTicketFromRow(row, columnMap);
      if (ticket) tickets.push(ticket);
    } catch (error) {
      console.warn(`Skipping row ${i + 1}: ${error.message}`);
    }
  }

  if (tickets.length === 0) {
    throw new Error('No valid tickets found in the file');
  }

  return tickets;
}

function createColumnMapping(headers) {
  const columnMappings = {
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

  const mapping = {};
  for (const [field, possibleNames] of Object.entries(columnMappings)) {
    const columnIndex = headers.findIndex(header => 
      possibleNames.some(name => header.includes(name))
    );
    if (columnIndex !== -1) {
      mapping[field] = columnIndex;
    }
  }

  const requiredFields = ['key', 'summary', 'issueType', 'status', 'created'];
  const missingFields = requiredFields.filter(field => !(field in mapping));
  
  if (missingFields.length > 0) {
    throw new Error(`Required columns not found: ${missingFields.join(', ')}`);
  }

  return mapping;
}

function parseTicketFromRow(row, columnMap) {
  const getValue = (field) => {
    const index = columnMap[field];
    return index !== undefined && index < row.length ? row[index] : undefined;
  };

  const key = parseString(getValue('key'));
  const summary = parseString(getValue('summary'));
  const issueType = parseString(getValue('issueType'));
  const status = parseString(getValue('status'));
  const created = parseDate(getValue('created'));

  if (!key || !summary || !issueType || !status || !created) {
    return null;
  }

  const ticket = {
    key,
    summary,
    issueType,
    status,
    created,
    sprints: parseSprints(getValue('sprints'))
  };

  const parent = parseString(getValue('parent'));
  const storyPoints = parseNumber(getValue('storyPoints'));
  const resolved = parseDate(getValue('resolved'));
  const originTicketType = parseString(getValue('originTicketType'));

  if (parent) ticket.parent = parent;
  if (storyPoints !== undefined) ticket.storyPoints = storyPoints;
  if (resolved) ticket.resolved = resolved;
  if (originTicketType) ticket.originTicketType = originTicketType;

  return ticket;
}

function parseString(value) {
  if (value === null || value === undefined || value === '') return undefined;
  return String(value).trim();
}

function parseNumber(value) {
  if (value === null || value === undefined || value === '') return undefined;
  const num = Number(value);
  return isNaN(num) ? undefined : num;
}

function parseDate(value) {
  if (value === null || value === undefined || value === '') return undefined;
  
  if (value instanceof Date) {
    return value.toISOString();
  }
  
  if (typeof value === 'string') {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
  }
  
  return undefined;
}

function parseSprints(value) {
  if (value === null || value === undefined || value === '') return [];
  
  const sprintStr = String(value);
  
  if (sprintStr.includes(',')) {
    return sprintStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
  }
  
  if (sprintStr.includes(';')) {
    return sprintStr.split(';').map(s => s.trim()).filter(s => s.length > 0);
  }
  
  return [sprintStr.trim()];
}

function isEmptyRow(row) {
  return row.every(cell => 
    cell === null || 
    cell === undefined || 
    String(cell).trim() === ''
  );
}

function extractMetadata(tickets) {
  const projectKeys = Array.from(new Set(
    tickets
      .map(ticket => ticket.key?.split('-')[0])
      .filter(key => key && key.length > 0)
  )).sort();

  return {
    exportDate: new Date().toISOString(),
    projectKeys
  };
}

// Simplified transformation functions
function transformTickets(rawTickets) {
  return rawTickets.map(rawTicket => {
    const createdDate = new Date(rawTicket.created);
    const resolvedDate = rawTicket.resolved ? new Date(rawTicket.resolved) : undefined;
    const duration = calculateDuration(createdDate, resolvedDate);
    const sprintCount = rawTicket.sprints ? rawTicket.sprints.length : 0;
    const isEscapedBug = isEscapedBugTicket(rawTicket);
    const summaryLength = rawTicket.summary.length;
    const storyPoints = rawTicket.storyPoints || 0;

    return {
      key: rawTicket.key,
      summary: rawTicket.summary,
      issueType: rawTicket.issueType,
      status: rawTicket.status,
      parent: rawTicket.parent,
      storyPoints,
      createdDate,
      resolvedDate,
      duration,
      sprintCount,
      isEscapedBug,
      summaryLength
    };
  });
}

function calculateDuration(createdDate, resolvedDate) {
  if (!resolvedDate) return undefined;
  const diffInMs = resolvedDate.getTime() - createdDate.getTime();
  return Math.max(0, Math.ceil(diffInMs / (1000 * 60 * 60 * 24)));
}

function isEscapedBugTicket(rawTicket) {
  if (rawTicket.issueType?.toLowerCase() !== 'bug') return false;
  
  const originType = rawTicket.originTicketType?.toLowerCase();
  if (!originType) return false;

  const escapedBugIndicators = [
    'regression testing', 'uat', 'user acceptance testing',
    'production', 'customer', 'external', 'qa', 'testing'
  ];

  return escapedBugIndicators.some(indicator => originType.includes(indicator));
}

function buildEpicAggregations(processedTickets, rawTickets) {
  const epicMap = new Map();

  // Initialize epics
  for (const ticket of processedTickets) {
    if (ticket.parent && !epicMap.has(ticket.parent)) {
      const epicName = findEpicName(ticket.parent, rawTickets) || ticket.parent;
      epicMap.set(ticket.parent, {
        key: ticket.parent,
        name: epicName,
        ticketCount: 0,
        totalStoryPoints: 0,
        completedTickets: 0
      });
    }
    
    if (ticket.issueType.toLowerCase() === 'epic' && !epicMap.has(ticket.key)) {
      epicMap.set(ticket.key, {
        key: ticket.key,
        name: ticket.summary,
        ticketCount: 0,
        totalStoryPoints: 0,
        completedTickets: 0
      });
    }
  }

  // Aggregate data
  for (const ticket of processedTickets) {
    if (ticket.parent && epicMap.has(ticket.parent)) {
      const epic = epicMap.get(ticket.parent);
      epic.ticketCount++;
      epic.totalStoryPoints += ticket.storyPoints;
      
      if (isTicketCompleted(ticket.status)) {
        epic.completedTickets++;
      }
    }
  }

  return Array.from(epicMap.values()).filter(epic => epic.ticketCount > 0);
}

function findEpicName(epicKey, rawTickets) {
  const epicTicket = rawTickets.find(ticket => 
    ticket.key === epicKey && ticket.issueType?.toLowerCase() === 'epic'
  );
  return epicTicket?.summary || null;
}

function isTicketCompleted(status) {
  const completedStatuses = ['done', 'closed', 'resolved'];
  return completedStatuses.includes(status.toLowerCase());
}

function calculateDateRange(processedTickets) {
  if (processedTickets.length === 0) {
    const now = new Date();
    return { start: now, end: now };
  }

  let startDate = processedTickets[0].createdDate;
  let endDate = processedTickets[0].createdDate;

  for (const ticket of processedTickets) {
    if (ticket.createdDate < startDate) startDate = ticket.createdDate;
    if (ticket.createdDate > endDate) endDate = ticket.createdDate;
    
    if (ticket.resolvedDate) {
      if (ticket.resolvedDate < startDate) startDate = ticket.resolvedDate;
      if (ticket.resolvedDate > endDate) endDate = ticket.resolvedDate;
    }
  }

  return { start: startDate, end: endDate };
}

// CSV parsing functions
function parseCSVText(text) {
  const rows = [];
  const lines = text.split(/\r?\n/);
  
  for (const line of lines) {
    if (line.trim() === '') continue; // Skip empty lines
    
    const row = parseCSVRow(line);
    if (row.length > 0) {
      rows.push(row);
    }
  }
  
  return rows;
}

function parseCSVRow(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current.trim());
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }

  // Add the last field
  result.push(current.trim());

  return result;
}