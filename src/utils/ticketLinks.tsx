/**
 * Utility functions for creating clickable ticket links
 */

import React from 'react';

const JIRA_BASE_URL = 'https://george-labs.atlassian.net/browse/';

/**
 * Checks if a string contains a Jira ticket key pattern (e.g., GCUI-25286, GGDM-15772)
 */
export const isTicketKey = (text: string): boolean => {
  const ticketKeyPattern = /^[A-Z]+-\d+$/;
  return ticketKeyPattern.test(text.trim());
};

/**
 * Creates a clickable link for a ticket key
 */
export const createTicketLink = (ticketKey: string, className?: string): JSX.Element => {
  const url = `${JIRA_BASE_URL}${ticketKey}`;
  
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`hover:underline cursor-pointer transition-colors duration-200 ${className || ''}`}
      onClick={(e) => e.stopPropagation()}
    >
      {ticketKey}
    </a>
  );
};

/**
 * Renders text with clickable ticket links if the text is a ticket key
 */
export const renderTicketText = (text: string, className?: string): JSX.Element | string => {
  if (isTicketKey(text)) {
    return createTicketLink(text, className);
  }
  return text;
};

/**
 * Parses text and makes any ticket keys within it clickable
 * Useful for titles that contain ticket keys mixed with other text
 */
export const parseAndLinkTickets = (text: string, className?: string): JSX.Element => {
  const ticketKeyPattern = /([A-Z]+-\d+)/g;
  const parts = text.split(ticketKeyPattern);
  
  return (
    <>
      {parts.map((part, index) => {
        if (isTicketKey(part)) {
          return (
            <React.Fragment key={index}>
              {createTicketLink(part, className)}
            </React.Fragment>
          );
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </>
  );
};