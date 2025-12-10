# 🎯 Jira Insights Dashboard

Transform your Jira XLSX exports into engaging insights, achievements, and fun facts about your team's work patterns and productivity.

## ✨ Features

- **📊 Comprehensive Analytics**: Epic rankings, ticket patterns, and team performance metrics
- **🏆 Achievement Highlights**: Celebrate milestones and accomplishments with visual badges
- **🐛 Bug Analysis**: Track escaped bugs with trend charts and cumulative statistics
- **💡 Improvement Insights**: Constructive suggestions for process optimization
- **🎉 Fun Facts**: Discover interesting patterns in ticket naming, duration, and activity
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
- **Parent/Epic Link** (for epic aggregations)
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

### 🐛 Bug Analysis
- Escaped bug trends over time
- Monthly creation vs. closure rates
- Cumulative open bug tracking

### 💡 Process Improvements
- Sprint stability recommendations
- Duration optimization suggestions
- Quality improvement areas

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