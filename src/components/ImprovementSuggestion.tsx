/**
 * Improvement Suggestion Component for constructive feedback
 * Displays improvement areas in a positive, actionable format
 */

import React from 'react';
import { ImprovementArea } from '../types/insights';

export interface ImprovementSuggestionProps {
  improvement: ImprovementArea;
  size?: 'small' | 'medium' | 'large';
  showSeverity?: boolean;
}

export const ImprovementSuggestion: React.FC<ImprovementSuggestionProps> = ({
  improvement,
  size = 'medium',
  showSeverity = true
}) => {
  const getSeverityColor = (severity: ImprovementArea['severity']) => {
    switch (severity) {
      case 'high':
        return {
          border: 'border-orange-200',
          bg: 'bg-orange-50',
          text: 'text-orange-900',
          badge: 'bg-orange-100 text-orange-800',
          icon: 'text-orange-500'
        };
      case 'medium':
        return {
          border: 'border-yellow-200',
          bg: 'bg-yellow-50',
          text: 'text-yellow-900',
          badge: 'bg-yellow-100 text-yellow-800',
          icon: 'text-yellow-500'
        };
      case 'low':
        return {
          border: 'border-blue-200',
          bg: 'bg-blue-50',
          text: 'text-blue-900',
          badge: 'bg-blue-100 text-blue-800',
          icon: 'text-blue-500'
        };
      default:
        return {
          border: 'border-gray-200',
          bg: 'bg-gray-50',
          text: 'text-gray-900',
          badge: 'bg-gray-100 text-gray-800',
          icon: 'text-gray-500'
        };
    }
  };

  const getCategoryIcon = (category: ImprovementArea['category']) => {
    switch (category) {
      case 'process':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        );
      case 'quality':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'efficiency':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
    }
  };

  const sizeClasses = {
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8'
  };

  const colors = getSeverityColor(improvement.severity);

  return (
    <div className={`
      rounded-lg border-2 transition-all duration-200 hover:shadow-md
      ${colors.border}
      ${colors.bg}
      ${sizeClasses[size]}
    `}>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`flex-shrink-0 ${colors.icon} mt-1`}>
          {getCategoryIcon(improvement.category)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <h3 className={`font-semibold text-lg ${colors.text}`}>
              {improvement.title}
            </h3>
            
            {showSeverity && (
              <div className="flex gap-2 ml-4">
                <span className={`
                  inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                  ${colors.badge}
                `}>
                  {improvement.severity.charAt(0).toUpperCase() + improvement.severity.slice(1)}
                </span>
                <span className={`
                  inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                  bg-gray-100 text-gray-800
                `}>
                  {improvement.category.charAt(0).toUpperCase() + improvement.category.slice(1)}
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          <p className={`text-sm ${colors.text} mb-4 leading-relaxed`}>
            {improvement.description}
          </p>

          {/* Suggestion */}
          <div className="bg-white bg-opacity-60 rounded-md p-4 border border-white border-opacity-50">
            <div className="flex items-start gap-2">
              <div className={`flex-shrink-0 ${colors.icon} mt-0.5`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h4 className={`font-medium text-sm ${colors.text} mb-1`}>
                  💡 Suggestion
                </h4>
                <p className={`text-sm ${colors.text} leading-relaxed`}>
                  {improvement.suggestion}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};