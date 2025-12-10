# Jira Insights Dashboard

A web application that processes uploaded Jira reports (XLSX files) and generates engaging visualizations, insights, highlights, and fun facts for development teams.

## Features

- Upload and process Jira XLSX reports
- Generate team insights and achievements
- Visualize bug trends and patterns
- Discover interesting statistics about your work
- Client-side processing for data privacy

## Tech Stack

- React + TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Chart.js for visualizations
- XLSX library for file processing
- Fast-check for property-based testing

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Testing

Run tests with:
```bash
npm test
```

## Project Structure

```
src/
├── components/     # React components
├── services/       # Business logic and data processing
├── types/          # TypeScript type definitions
└── test/          # Test utilities and setup
```

## Development

This project follows a spec-driven development approach with comprehensive requirements, design documentation, and implementation tasks defined in the `.kiro/specs/` directory.