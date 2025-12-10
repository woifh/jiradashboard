/**
 * Tests for File Upload Component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileUploadComponent } from './FileUploadComponent';

describe('FileUploadComponent', () => {
  const mockOnFileSelected = vi.fn();

  beforeEach(() => {
    mockOnFileSelected.mockClear();
  });

  const defaultProps = {
    onFileSelected: mockOnFileSelected,
    isProcessing: false
  };

  it('should render upload area with correct text', () => {
    render(<FileUploadComponent {...defaultProps} />);
    
    expect(screen.getByText('Upload your Jira XLSX or CSV report')).toBeInTheDocument();
    expect(screen.getByText(/Click to browse/)).toBeInTheDocument();
    expect(screen.getByText(/drag and drop/)).toBeInTheDocument();
  });

  it('should show file requirements', () => {
    render(<FileUploadComponent {...defaultProps} />);
    
    expect(screen.getByText('File Requirements:')).toBeInTheDocument();
    expect(screen.getByText(/Export from Jira with ticket details/)).toBeInTheDocument();
    expect(screen.getByText(/Must include: Key, Summary/)).toBeInTheDocument();
  });

  it('should handle file selection through input', async () => {
    const user = userEvent.setup();
    render(<FileUploadComponent {...defaultProps} />);
    
    const file = new File(['test content'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const input = document.getElementById('file-input') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    
    // Simulate file selection
    await user.upload(input, file);
    
    expect(mockOnFileSelected).toHaveBeenCalledWith(file);
  });

  it('should show processing state', () => {
    render(<FileUploadComponent {...defaultProps} isProcessing={true} />);
    
    expect(screen.getByText('Processing your file...')).toBeInTheDocument();
    expect(screen.getByText(/Please wait while we process/)).toBeInTheDocument();
    expect(screen.getByText(/This may take a few moments/)).toBeInTheDocument();
  });

  it('should show error message', () => {
    const errorMessage = 'Invalid file format';
    render(<FileUploadComponent {...defaultProps} error={errorMessage} />);
    
    expect(screen.getByText('Upload Error')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('should disable interaction when processing', () => {
    render(<FileUploadComponent {...defaultProps} isProcessing={true} />);
    
    const input = document.getElementById('file-input') as HTMLInputElement;
    expect(input).toBeDisabled();
  });

  it('should handle drag and drop events', async () => {
    render(<FileUploadComponent {...defaultProps} />);
    
    const dropZone = screen.getByText(/Click to browse/).closest('div');
    expect(dropZone).toBeInTheDocument();

    const file = new File(['test content'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    // Simulate drag over
    fireEvent.dragOver(dropZone!, {
      dataTransfer: {
        files: [file]
      }
    });

    // Simulate drop
    fireEvent.drop(dropZone!, {
      dataTransfer: {
        files: [file]
      }
    });

    expect(mockOnFileSelected).toHaveBeenCalledWith(file);
  });

  it('should not handle file selection when processing', async () => {
    render(<FileUploadComponent {...defaultProps} isProcessing={true} />);
    
    const dropZone = screen.getByText(/Processing your file/).closest('div');
    const file = new File(['test content'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    // Simulate drop while processing
    fireEvent.drop(dropZone!, {
      dataTransfer: {
        files: [file]
      }
    });

    expect(mockOnFileSelected).not.toHaveBeenCalled();
  });

  it('should apply correct CSS classes for different states', () => {
    const { rerender } = render(<FileUploadComponent {...defaultProps} />);
    
    // Normal state - find the main drop zone div
    let dropZone = screen.getByText(/Click to browse/).closest('div')?.parentElement?.parentElement?.parentElement;
    expect(dropZone).toHaveClass('border-gray-300');
    expect(dropZone).toHaveClass('cursor-pointer');

    // Processing state
    rerender(<FileUploadComponent {...defaultProps} isProcessing={true} />);
    dropZone = screen.getByText(/Processing your file/).closest('div')?.parentElement?.parentElement;
    expect(dropZone).toHaveClass('opacity-50');
    expect(dropZone).toHaveClass('cursor-not-allowed');

    // Error state
    rerender(<FileUploadComponent {...defaultProps} error="Test error" />);
    dropZone = screen.getByText(/Click to browse/).closest('div')?.parentElement?.parentElement?.parentElement;
    expect(dropZone).toHaveClass('border-red-300');
    expect(dropZone).toHaveClass('bg-red-50');
  });

  it('should accept xlsx, xls, and csv files', () => {
    render(<FileUploadComponent {...defaultProps} />);
    
    const input = document.getElementById('file-input') as HTMLInputElement;
    expect(input).toHaveAttribute('accept', '.xlsx,.xls,.csv');
  });

  it('should reset input value after file selection', async () => {
    const user = userEvent.setup();
    render(<FileUploadComponent {...defaultProps} />);
    
    const file = new File(['test content'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const input = document.getElementById('file-input') as HTMLInputElement;
    
    await user.upload(input, file);
    
    // Input value should be reset to allow selecting the same file again
    expect(input.value).toBe('');
  });
});