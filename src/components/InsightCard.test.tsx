/**
 * Tests for Insight Card Component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InsightCard } from './InsightCard';

describe('InsightCard', () => {
  const defaultProps = {
    title: 'Test Metric',
    value: '42'
  };

  it('should render title and value', () => {
    render(<InsightCard {...defaultProps} />);
    
    expect(screen.getByText('Test Metric')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('should render description when provided', () => {
    render(<InsightCard {...defaultProps} description="This is a test description" />);
    
    expect(screen.getByText('This is a test description')).toBeInTheDocument();
  });

  it('should render icon when provided', () => {
    render(<InsightCard {...defaultProps} icon="🎯" />);
    
    const icon = screen.getByRole('img', { name: 'Test Metric' });
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveTextContent('🎯');
  });

  it('should apply correct color classes', () => {
    const { container, rerender } = render(<InsightCard {...defaultProps} color="green" />);
    
    // Check if green color classes are applied somewhere in the component
    expect(container.querySelector('.bg-green-50')).toBeInTheDocument();
    expect(container.querySelector('.border-green-200')).toBeInTheDocument();

    rerender(<InsightCard {...defaultProps} color="red" />);
    expect(container.querySelector('.bg-red-50')).toBeInTheDocument();
    expect(container.querySelector('.border-red-200')).toBeInTheDocument();
  });

  it('should apply correct size classes', () => {
    const { container, rerender } = render(<InsightCard {...defaultProps} size="small" />);
    
    // Check if size classes are applied somewhere in the component
    expect(container.querySelector('.p-4')).toBeInTheDocument();

    rerender(<InsightCard {...defaultProps} size="large" />);
    expect(container.querySelector('.p-8')).toBeInTheDocument();
  });

  it('should render trend icons', () => {
    const { rerender } = render(<InsightCard {...defaultProps} trend="up" />);
    
    let trendIcon = screen.getByText('Test Metric').parentElement?.querySelector('svg');
    expect(trendIcon).toBeInTheDocument();
    expect(trendIcon).toHaveClass('text-green-500');

    rerender(<InsightCard {...defaultProps} trend="down" />);
    trendIcon = screen.getByText('Test Metric').parentElement?.querySelector('svg');
    expect(trendIcon).toHaveClass('text-red-500');

    rerender(<InsightCard {...defaultProps} trend="neutral" />);
    trendIcon = screen.getByText('Test Metric').parentElement?.querySelector('svg');
    expect(trendIcon).toHaveClass('text-gray-500');
  });

  it('should handle numeric values', () => {
    render(<InsightCard {...defaultProps} value={123} />);
    
    expect(screen.getByText('123')).toBeInTheDocument();
  });
});