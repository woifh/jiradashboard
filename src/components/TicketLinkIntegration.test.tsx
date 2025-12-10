/**
 * Integration tests for ticket link functionality in components
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatisticHighlight } from './StatisticHighlight';
import { InsightCard } from './InsightCard';

describe('Ticket Link Integration', () => {
  describe('StatisticHighlight', () => {
    it('should make ticket key subtitles clickable', () => {
      render(
        <StatisticHighlight
          title="Most Sprint Changes"
          value={5}
          subtitle="GCUI-25286"
          description="This ticket changed sprints frequently"
        />
      );

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://george-labs.atlassian.net/browse/GCUI-25286');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveTextContent('GCUI-25286');
    });

    it('should not make non-ticket subtitles clickable', () => {
      render(
        <StatisticHighlight
          title="Some Metric"
          value={10}
          subtitle="Not a ticket key"
          description="This is just regular text"
        />
      );

      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      expect(screen.getByText('Not a ticket key')).toBeInTheDocument();
    });
  });

  describe('InsightCard', () => {
    it('should make ticket keys in titles clickable', () => {
      render(
        <InsightCard
          title="#1 GCUI-25286: Epic Name"
          value={42}
          description="Some epic description"
        />
      );

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://george-labs.atlassian.net/browse/GCUI-25286');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveTextContent('GCUI-25286');

      // Check that other text is preserved
      expect(screen.getByText('#1', { exact: false })).toBeInTheDocument();
      expect(screen.getByText(': Epic Name', { exact: false })).toBeInTheDocument();
    });

    it('should handle titles without ticket keys', () => {
      render(
        <InsightCard
          title="Regular Title"
          value={42}
          description="No ticket keys here"
        />
      );

      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      expect(screen.getByText('Regular Title')).toBeInTheDocument();
    });

    it('should handle multiple ticket keys in title', () => {
      render(
        <InsightCard
          title="Related: GCUI-25286 and GGDM-15772"
          value={42}
          description="Multiple tickets"
        />
      );

      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(2);
      
      expect(links[0]).toHaveAttribute('href', 'https://george-labs.atlassian.net/browse/GCUI-25286');
      expect(links[1]).toHaveAttribute('href', 'https://george-labs.atlassian.net/browse/GGDM-15772');
    });
  });
});