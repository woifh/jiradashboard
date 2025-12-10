/**
 * Statistic Highlight Component for fun facts and notable statistics
 * Displays statistics in an engaging, visual format
 */

import React from 'react';
import { renderTicketText } from '../utils/ticketLinks';

export interface StatisticHighlightProps {
  title: string;
  value: string | number;
  subtitle?: string;
  description?: string;
  icon?: string;
  variant?: 'default' | 'fun' | 'impressive' | 'curious';
  size?: 'small' | 'medium' | 'large';
}

export const StatisticHighlight: React.FC<StatisticHighlightProps> = ({
  title,
  value,
  subtitle,
  description,
  icon,
  variant = 'default',
  size = 'medium'
}) => {
  const getVariantStyles = (variant: StatisticHighlightProps['variant']) => {
    switch (variant) {
      case 'fun':
        return {
          container: 'bg-gradient-to-br from-pink-50 to-purple-50 border-pink-200 hover:from-pink-100 hover:to-purple-100',
          title: 'text-pink-800',
          value: 'text-purple-700',
          subtitle: 'text-pink-600',
          description: 'text-pink-700'
        };
      case 'impressive':
        return {
          container: 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:from-green-100 hover:to-emerald-100',
          title: 'text-green-800',
          value: 'text-emerald-700',
          subtitle: 'text-green-600',
          description: 'text-green-700'
        };
      case 'curious':
        return {
          container: 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 hover:from-yellow-100 hover:to-orange-100',
          title: 'text-yellow-800',
          value: 'text-orange-700',
          subtitle: 'text-yellow-600',
          description: 'text-yellow-700'
        };
      default:
        return {
          container: 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 hover:from-blue-100 hover:to-indigo-100',
          title: 'text-blue-800',
          value: 'text-indigo-700',
          subtitle: 'text-blue-600',
          description: 'text-blue-700'
        };
    }
  };

  const sizeClasses = {
    small: {
      container: 'p-4',
      icon: 'text-2xl',
      value: 'text-2xl',
      title: 'text-sm',
      subtitle: 'text-xs',
      description: 'text-xs'
    },
    medium: {
      container: 'p-6',
      icon: 'text-3xl',
      value: 'text-3xl',
      title: 'text-base',
      subtitle: 'text-sm',
      description: 'text-sm'
    },
    large: {
      container: 'p-8',
      icon: 'text-4xl',
      value: 'text-4xl',
      title: 'text-lg',
      subtitle: 'text-base',
      description: 'text-base'
    }
  };

  const styles = getVariantStyles(variant);
  const sizes = sizeClasses[size];

  return (
    <div className={`
      rounded-xl border-2 transition-all duration-300 hover:shadow-lg hover:scale-105 transform
      ${styles.container}
      ${sizes.container}
    `}>
      <div className="text-center">
        {/* Icon */}
        {icon && (
          <div className="mb-4">
            <span 
              className={`${sizes.icon} filter drop-shadow-sm`}
              role="img" 
              aria-label={title}
            >
              {icon}
            </span>
          </div>
        )}

        {/* Value */}
        <div className={`font-bold ${sizes.value} ${styles.value} mb-2 filter drop-shadow-sm`}>
          {value}
        </div>

        {/* Title */}
        <h3 className={`font-semibold ${sizes.title} ${styles.title} mb-1`}>
          {title}
        </h3>

        {/* Subtitle */}
        {subtitle && (
          <p className={`${sizes.subtitle} ${styles.subtitle} mb-3 font-medium`}>
            {renderTicketText(subtitle, `hover:${styles.subtitle.replace('text-', 'text-opacity-80 text-')} hover:underline`)}
          </p>
        )}

        {/* Description */}
        {description && (
          <p className={`${sizes.description} ${styles.description} leading-relaxed`}>
            {description}
          </p>
        )}
      </div>

      {/* Decorative corner element */}
      <div className="absolute top-3 right-3 opacity-20">
        {variant === 'fun' && (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
          </svg>
        )}
        {variant === 'impressive' && (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        )}
        {variant === 'curious' && (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        )}
        {variant === 'default' && (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        )}
      </div>
    </div>
  );
};