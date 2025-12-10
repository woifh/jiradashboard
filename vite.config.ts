import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
  },
  build: {
    // Optimize chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'chart-vendor': ['chart.js', 'react-chartjs-2'],
          'xlsx-vendor': ['xlsx'],
          // App chunks
          'components': [
            './src/components/InsightCard.tsx',
            './src/components/AchievementBadge.tsx',
            './src/components/StatisticHighlight.tsx',
            './src/components/ImprovementSuggestion.tsx',
            './src/components/TrendChart.tsx'
          ],
          'services': [
            './src/services/XLSXParserService.ts',
            './src/services/DataTransformationService.ts',
            './src/services/InsightsEngine.ts'
          ]
        }
      }
    },
    // Increase chunk size warning limit since we have large dependencies
    chunkSizeWarningLimit: 1000,
    // Enable source maps for production debugging
    sourcemap: true
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'chart.js', 'react-chartjs-2', 'xlsx']
  }
})