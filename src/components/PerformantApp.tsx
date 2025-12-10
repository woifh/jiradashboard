/**
 * Performance-optimized App component using Web Workers
 * Handles heavy data processing off the main thread
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  FileUploadComponent,
  InsightCard,
  AchievementBadge,
  TrendChart,
  StatisticHighlight,
  ImprovementSuggestion
} from './index';
import { InsightsEngine } from '../services';
import { useWebWorker } from '../hooks/useWebWorker';
import { DashboardInsights } from '../types/insights';
import { ProcessedJiraData, RawJiraData } from '../types/jira-data';

interface AppState {
  isProcessing: boolean;
  error: string | null;
  insights: DashboardInsights | null;
  processedData: ProcessedJiraData | null;
  progress: number;
  stage: string;
}

export const PerformantApp: React.FC = () => {
  const [state, setState] = useState<AppState>({
    isProcessing: false,
    error: null,
    insights: null,
    processedData: null,
    progress: 0,
    stage: 'idle'
  });

  // Initialize insights engine (memoized to prevent recreation)
  const insightsEngine = useMemo(() => new InsightsEngine(), []);

  // Web Worker for heavy processing
  const { postMessage, terminate, isSupported } = useWebWorker('/dataProcessor.worker.js', {
    onProgress: (progress, stage) => {
      setState(prev => ({ ...prev, progress, stage: stage || prev.stage }));
    },
    onError: (error) => {
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error,
        progress: 0,
        stage: 'error'
      }));
    }
  });

  // Cleanup worker on unmount
  useEffect(() => {
    return () => {
      terminate();
    };
  }, [terminate]);

  const handleFileSelected = useCallback(async (file: File) => {
    setState(prev => ({ 
      ...prev, 
      isProcessing: true, 
      error: null, 
      progress: 0, 
      stage: 'starting' 
    }));

    try {
      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      if (isSupported) {
        // Use Web Worker for processing
        setState(prev => ({ ...prev, stage: 'parsing' }));
        
        postMessage<RawJiraData>('PARSE_XLSX', arrayBuffer, (rawData) => {
          setState(prev => ({ ...prev, stage: 'transforming', progress: 0 }));
          
          postMessage<ProcessedJiraData>('TRANSFORM_DATA', rawData, (processedData) => {
            setState(prev => ({ ...prev, stage: 'analyzing', progress: 90 }));
            
            // Generate insights on main thread (lightweight operation)
            const insights = insightsEngine.generateAllInsights(processedData);
            
            setState({
              isProcessing: false,
              error: null,
              insights,
              processedData,
              progress: 100,
              stage: 'complete'
            });
          });
        });
      } else {
        // Fallback to main thread processing
        const { XLSXParserService, DataTransformationService } = await import('../services');
        
        const xlsxParser = new XLSXParserService();
        const dataTransformer = new DataTransformationService();
        
        setState(prev => ({ ...prev, stage: 'parsing', progress: 25 }));
        const rawData = await xlsxParser.parseFile(file);
        
        setState(prev => ({ ...prev, stage: 'transforming', progress: 50 }));
        const processedData = dataTransformer.transformRawData(rawData);
        
        setState(prev => ({ ...prev, stage: 'analyzing', progress: 75 }));
        const insights = insightsEngine.generateAllInsights(processedData);

        setState({
          isProcessing: false,
          error: null,
          insights,
          processedData,
          progress: 100,
          stage: 'complete'
        });
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        progress: 0,
        stage: 'error'
      }));
    }
  }, [postMessage, insightsEngine, isSupported]);

  const resetDashboard = useCallback(() => {
    setState({
      isProcessing: false,
      error: null,
      insights: null,
      processedData: null,
      progress: 0,
      stage: 'idle'
    });
    terminate();
  }, [terminate]);

  // Memoized components to prevent unnecessary re-renders
  const uploadSection = useMemo(() => (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Get Started
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Upload your Jira XLSX export to discover interesting patterns, achievements, 
          and insights about your team's work. We'll transform your data into engaging 
          highlights and fun facts.
        </p>
      </div>

      <FileUploadComponent
        onFileSelected={handleFileSelected}
        isProcessing={state.isProcessing}
        {...(state.error && { error: state.error })}
      />

      {/* Progress indicator */}
      {state.isProcessing && (
        <div className="mt-6 max-w-md mx-auto">
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 capitalize">
                {state.stage.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              <span className="text-sm text-gray-500">
                {Math.round(state.progress)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${state.progress}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  ), [handleFileSelected, state.isProcessing, state.error, state.stage, state.progress]);

  const dashboardSection = useMemo(() => {
    if (!state.insights || !state.processedData) return null;

    return (
      <div className="space-y-8">
        {/* Overview Stats */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            📊 Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <InsightCard
              title="Total Tickets"
              value={state.insights.metadata.totalTickets}
              description="Tickets analyzed in this report"
              icon="🎫"
              color="blue"
            />
            <InsightCard
              title="Date Range"
              value={`${Math.ceil((state.insights.metadata.dateRange.end.getTime() - state.insights.metadata.dateRange.start.getTime()) / (1000 * 60 * 60 * 24))} days`}
              description={`From ${state.insights.metadata.dateRange.start.toLocaleDateString()} to ${state.insights.metadata.dateRange.end.toLocaleDateString()}`}
              icon="📅"
              color="green"
            />
            <InsightCard
              title="Epics Tracked"
              value={state.processedData.epics.length}
              description="Epic-level initiatives identified"
              icon="🏗️"
              color="purple"
            />
          </div>
        </section>

        {/* Achievements */}
        {state.insights.achievements.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              🏆 Team Achievements
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {state.insights.achievements.map((achievement, index) => (
                <AchievementBadge
                  key={index}
                  achievement={achievement}
                  size="medium"
                />
              ))}
            </div>
          </section>
        )}

        {/* Epic Insights */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            🎯 Epic Highlights
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-4">
                Top Epics by Ticket Count
              </h3>
              <div className="space-y-4">
                {state.insights.epic.topByTicketCount.map((epic, index) => (
                  <InsightCard
                    key={epic.key}
                    title={`#${index + 1} ${epic.name}`}
                    value={epic.ticketCount}
                    description={`${epic.completedTickets} completed tickets`}
                    icon={index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                    color={index === 0 ? 'yellow' : index === 1 ? 'gray' : 'red'}
                    size="small"
                  />
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-4">
                Top Epics by Story Points
              </h3>
              <div className="space-y-4">
                {state.insights.epic.topByStoryPoints.map((epic, index) => (
                  <InsightCard
                    key={epic.key}
                    title={`#${index + 1} ${epic.name}`}
                    value={epic.totalStoryPoints}
                    description={`${epic.completedTickets} completed tickets`}
                    icon={index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                    color={index === 0 ? 'yellow' : index === 1 ? 'gray' : 'red'}
                    size="small"
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Fun Facts */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            🎉 Fun Facts & Curiosities
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatisticHighlight
              title="Most Sprint Changes"
              value={state.insights.ticket.mostSprintChanges.sprintCount}
              subtitle={state.insights.ticket.mostSprintChanges.key}
              description={state.insights.ticket.mostSprintChanges.summary}
              icon="🔄"
              variant="curious"
            />
            <StatisticHighlight
              title="Longest Duration"
              value={state.insights.ticket.longestDuration ? `${state.insights.ticket.longestDuration.duration || 0} days` : "No resolved tickets"}
              subtitle={state.insights.ticket.longestDuration?.key || "N/A"}
              description={state.insights.ticket.longestDuration?.summary || "Upload data with resolved tickets to see duration insights"}
              icon="⏱️"
              variant="impressive"
            />
            <StatisticHighlight
              title="Longest Summary"
              value={`${state.insights.ticket.longestSummary.summaryLength} chars`}
              subtitle={state.insights.ticket.longestSummary.key}
              description={state.insights.ticket.longestSummary.summary}
              icon="📝"
              variant="fun"
            />
            <StatisticHighlight
              title="Shortest Summary"
              value={`${state.insights.ticket.shortestSummary.summaryLength} chars`}
              subtitle={state.insights.ticket.shortestSummary.key}
              description={state.insights.ticket.shortestSummary.summary}
              icon="✂️"
              variant="default"
            />
          </div>
        </section>

        {/* Bug Analysis */}
        {state.insights.bug.monthlyTrends.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              🐛 Bug Analysis
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <TrendChart
                  data={state.insights.bug.monthlyTrends}
                  title="Escaped Bug Trends"
                  height={300}
                />
              </div>
              <div className="space-y-4">
                <InsightCard
                  title="Total Escaped Bugs"
                  value={state.insights.bug.escapedBugStats.totalCreated}
                  description="Bugs found externally (UAT, production, etc.)"
                  icon="🚨"
                  color="red"
                />
                <InsightCard
                  title="Bugs Resolved"
                  value={state.insights.bug.escapedBugStats.totalClosed}
                  description="Escaped bugs that have been fixed"
                  icon="✅"
                  color="green"
                />
              </div>
            </div>
          </section>
        )}

        {/* Improvement Areas */}
        {state.insights.improvementAreas.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              💡 Areas for Growth
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {state.insights.improvementAreas.map((improvement, index) => (
                <ImprovementSuggestion
                  key={index}
                  improvement={improvement}
                  size="medium"
                />
              ))}
            </div>
          </section>
        )}

        {/* Activity Patterns */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            📈 Activity Patterns
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-4">
                Busiest Creation Days
              </h3>
              <div className="space-y-3">
                {state.insights.ticket.busiestCreationDays.slice(0, 3).map((day) => (
                  <InsightCard
                    key={day.date.toISOString()}
                    title={day.date.toLocaleDateString()}
                    value={day.count}
                    description={`ticket${day.count > 1 ? 's' : ''} created`}
                    icon="📅"
                    color="blue"
                    size="small"
                  />
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-4">
                Busiest Closure Days
              </h3>
              <div className="space-y-3">
                {state.insights.ticket.busiestClosureDays.slice(0, 3).map((day) => (
                  <InsightCard
                    key={day.date.toISOString()}
                    title={day.date.toLocaleDateString()}
                    value={day.count}
                    description={`ticket${day.count > 1 ? 's' : ''} closed`}
                    icon="✅"
                    color="green"
                    size="small"
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }, [state.insights, state.processedData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🎯 Jira Insights Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Transform your Jira data into engaging insights and fun facts
              </p>
              {!isSupported && (
                <p className="text-yellow-600 text-sm mt-1">
                  ⚠️ Web Workers not supported - using fallback processing
                </p>
              )}
            </div>
            {state.insights && (
              <button
                onClick={resetDashboard}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Upload New File
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!state.insights ? uploadSection : dashboardSection}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-gray-600">
            <p>
              Generated on {new Date().toLocaleDateString()} • 
              {state.insights && (
                <span> {state.insights.metadata.totalTickets} tickets analyzed</span>
              )}
              {isSupported && <span> • Web Worker enabled</span>}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};