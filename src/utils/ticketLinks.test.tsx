/**
 * Tests for ticket link utilities
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { isTicketKey, createTicketLink, renderTicketText, parseAndLinkTickets } from './ticketLinks';

describe('ticketLinks utilities', () => {
  describe('isTicketKey', () => {
    it('should identify valid ticket keys', () => {
      expect(isTicketKey('GCUI-25286')).toBe(true);
      expect(isTicketKey('GGDM-15772')).toBe(true);
      expect(isTicketKey('ABC-123')).toBe(true);
      expect(isTicketKey('PROJECT-999')).toBe(true);
    });

    it('should reject invalid ticket keys', () => {
      expect(isTicketKey('invalid')).toBe(false);
      expect(isTicketKey('123-ABC')).toBe(false);
      expect(isTicketKey('GCUI')).toBe(false);
      expect(isTicketKey('GCUI-')).toBe(false);
      expect(isTicketKey('-25286')).toBe(false);
      expect(isTicketKey('')).toBe(false);
    });
  });

  describe('createTicketLink', () => {
    it('should create a clickable link with correct URL', () => {
      const ticketKey = 'GCUI-25286';
      render(createTicketLink(ticketKey));
      
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://george-labs.atlassian.net/browse/GCUI-25286');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      expect(link).toHaveTextContent('GCUI-25286');
    });

    it('should apply custom className', () => {
      const ticketKey = 'GGDM-15772';
      const customClass = 'text-blue-500';
      render(createTicketLink(ticketKey, customClass));
      
      const link = screen.getByRole('link');
      expect(link).toHaveClass(customClass);
    });
  });

  describe('renderTicketText', () => {
    it('should render ticket key as clickable link', () => {
      const ticketKey = 'GCUI-25286';
      const result = renderTicketText(ticketKey);
      
      render(<div>{result}</div>);
      
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://george-labs.atlassian.net/browse/GCUI-25286');
      expect(link).toHaveTextContent('GCUI-25286');
    });

    it('should render non-ticket text as plain string', () => {
      const text = 'Just some text';
      const result = renderTicketText(text);
      
      expect(result).toBe('Just some text');
    });
  });

  describe('parseAndLinkTickets', () => {
    it('should make ticket keys clickable in mixed text', () => {
      const text = '#1 GCUI-25286: Some Epic Name';
      const result = parseAndLinkTickets(text);
      
      render(<div>{result}</div>);
      
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://george-labs.atlassian.net/browse/GCUI-25286');
      expect(link).toHaveTextContent('GCUI-25286');
      
      // Check that other text is preserved
      expect(screen.getByText('#1', { exact: false })).toBeInTheDocument();
      expect(screen.getByText(': Some Epic Name', { exact: false })).toBeInTheDocument();
    });

    it('should handle multiple ticket keys in text', () => {
      const text = 'Related to GCUI-25286 and GGDM-15772';
      const result = parseAndLinkTickets(text);
      
      render(<div>{result}</div>);
      
      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(2);
      
      expect(links[0]).toHaveAttribute('href', 'https://george-labs.atlassian.net/browse/GCUI-25286');
      expect(links[1]).toHaveAttribute('href', 'https://george-labs.atlassian.net/browse/GGDM-15772');
    });

    it('should handle text with no ticket keys', () => {
      const text = 'No tickets here';
      const result = parseAndLinkTickets(text);
      
      render(<div>{result}</div>);
      
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      expect(screen.getByText('No tickets here')).toBeInTheDocument();
    });
  });
});