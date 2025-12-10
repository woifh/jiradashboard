# 🎯 Jira Insights Dashboard

Transform your Jira XLSX exports into engaging insights, achievements, and fun facts about your team's work patterns and productivity.

## ✨ Features

- **📊 Comprehensive Analytics**: Epic rankings, ticket patterns, and team performance metrics
- **🏆 Achievement Highlights**: Celebrate milestones and accomplishments with visual badges
- **🐛 Comprehensive Bug Analysis**: Track all bugs and escaped bugs with detailed metrics, trends, and insights
- **💡 Improvement Insights**: Constructive suggestions for process optimization
- **🎉 Fun Facts**: Discover interesting patterns in ticket naming, duration, and activity
- **🔗 Clickable Ticket Links**: All ticket keys are clickable and open directly in Jira (new tab)
- **⚡ Performance Optimized**: Web Workers for heavy data processing
- **📱 Responsive Design**: Works seamlessly on desktop and mobile devices
- **♿ Accessible**: Full keyboard navigation and screen reader support

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd jira-insights-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory, ready for deployment to any static hosting service.

## 📋 How to Use

1. **Export Data from Jira**:
   - Go to your Jira project
   - Navigate to Issues → Search for issues
   - Use "Export" → "Export Excel (All Fields)" or "Export CSV (All Fields)"
   - Save the XLSX or CSV file

2. **Upload to Dashboard**:
   - Drag and drop your XLSX or CSV file or click to browse
   - Wait for processing (large files may take a moment)
   - Explore your insights!

### Supported File Formats

- **XLSX/XLS**: Excel files exported from Jira
- **CSV**: Comma-separated values with comma (`,`) as separator

### Required Jira Fields

The dashboard requires these fields in your export:
- **Key** (e.g., PROJ-123)
- **Summary** (ticket title)
- **Issue Type** (Story, Bug, Task, etc.)
- **Status** (Done, In Progress, etc.)
- **Created** (creation date)

### Optional Fields (for enhanced insights)

- **Story Points** (for effort analysis)
- **Parent key** and **Parent summary** (for epic aggregations with proper key and name display)
- **Custom field (Team (migrated))** (for team-specific dashboard headlines)
- **Resolved** (for duration calculations)
- **Sprint** (for sprint change analysis)
- **Origin Ticket Type** (for escaped bug detection)

## 🎨 What You'll Discover

### 📈 Epic Insights
- Top epics by ticket count and story points
- Epic completion rates and progress

### 🎯 Team Achievements
- Story points delivered
- Tickets completed
- Quality metrics

### 🔍 Interesting Patterns
- Tickets with most sprint changes
- Longest and shortest ticket durations
- Busiest creation and closure days
- Summary length extremes

### 🐛 Comprehensive Bug Analysis
- **All Bugs Overview**: Total bugs, resolved, open, and average resolution time
- **Escaped Bug Analysis**: Dedicated section for bugs found externally (UAT, production)
- **Bug Trends**: Separate trend charts for all bugs and escaped bugs over time
- **Bug Insights**: Oldest open bug, most recent bug, and distribution by status
- **Escape Rate**: Percentage of bugs that escaped to external environments
- **Resolution Metrics**: Average time to resolve bugs with duration tracking

### 💡 Process Improvements
- Sprint stability recommendations
- Duration optimization suggestions
- Quality improvement areas

### 🔗 Interactive Features
- **Clickable Ticket Links**: All ticket keys (e.g., GCUI-25286, GGDM-15772) are automatically detected and made clickable
- **Direct Jira Access**: Click any ticket key to open it directly in your Jira instance (opens in new tab)
- **Smart Detection**: Works in epic titles, ticket statistics, and anywhere ticket keys appear

### 👥 Team-Specific Insights
- **Dynamic Headlines**: Dashboard title automatically includes team names from your data
- **Multi-Team Support**: Displays all teams when data contains multiple teams
- **Smart Extraction**: Handles comma-separated teams in single fields
- **Team Context**: Subtitle provides context about which teams the insights represent

## 🛠 Technical Details

### Architecture

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS for responsive design
- **Charts**: Chart.js for data visualization
- **Data Processing**: XLSX library with Web Worker optimization
- **Testing**: Vitest + React Testing Library

### Performance Features

- **Web Workers**: Heavy data processing runs off the main thread
- **Progressive Loading**: Visual progress indicators during processing
- **Memory Optimization**: Efficient data structures and cleanup
- **Responsive UI**: Maintains interactivity during processing

### Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## 📦 Deployment

The dashboard is a static web application that can be deployed to:

- **Netlify**: Drag and drop the `dist` folder
- **Vercel**: Connect your Git repository
- **GitHub Pages**: Use the built-in Actions workflow
- **AWS S3**: Upload the `dist` folder to an S3 bucket
- **Any static hosting service**

## 🔒 Privacy & Security

- **Client-Side Only**: All data processing happens in your browser
- **No Data Storage**: Files are not uploaded to any server
- **No Tracking**: No analytics or user tracking
- **Secure**: Data never leaves your machine

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [React](https://reactjs.org/) and [TypeScript](https://www.typescriptlang.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Charts powered by [Chart.js](https://www.chartjs.org/)
- XLSX parsing by [SheetJS](https://sheetjs.com/)

---

**Made with ❤️ for development teams who want to celebrate their work and improve their processes.**