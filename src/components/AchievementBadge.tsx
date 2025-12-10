/**
 * Achievement Badge Component for highlighting accomplishments
 * Displays achievements with celebratory styling
 */

import React from 'react';
import { Achievement } from '../types/insights';

export interface AchievementBadgeProps {
  achievement: Achievement;
  size?: 'small' | 'medium' | 'large';
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  achievement,
  size = 'medium'
}) => {
  const getCategoryColor = (category: Achievement['category']) => {
    switch (category) {
      case 'milestone':
        return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white';
      case 'performance':
        return 'bg-gradient-to-r from-blue-500 to-purple-600 text-white';
      case 'quality':
        return 'bg-gradient-to-r from-green-500 to-teal-600 text-white';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
    }
  };

  const sizeClasses = {
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8'
  };

  const iconSizeClasses = {
    small: 'text-2xl',
    medium: 'text-3xl',
    large: 'text-4xl'
  };

  const valueSizeClasses = {
    small: 'text-xl',
    medium: 'text-2xl',
    large: 'text-3xl'
  };

  return (
    <div className={`
      rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl
      ${getCategoryColor(achievement.category)}
      ${sizeClasses[size]}
    `}>
      <div className="text-center">
        {/* Icon */}
        <div className="mb-3">
          <span 
            className={`${iconSizeClasses[size]} filter drop-shadow-sm`}
            role="img" 
            aria-label={achievement.title}
          >
            {achievement.icon}
          </span>
        </div>

        {/* Value */}
        <div className={`font-bold ${valueSizeClasses[size]} mb-2 filter drop-shadow-sm`}>
          {achievement.value}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-lg mb-2 filter drop-shadow-sm">
          {achievement.title}
        </h3>

        {/* Description */}
        <p className="text-sm opacity-90 leading-relaxed filter drop-shadow-sm">
          {achievement.description}
        </p>

        {/* Category Badge */}
        <div className="mt-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white bg-opacity-20 backdrop-blur-sm">
            {achievement.category.charAt(0).toUpperCase() + achievement.category.slice(1)}
          </span>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-2 right-2 opacity-20">
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
        </svg>
      </div>
    </div>
  );
};