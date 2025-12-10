/**
 * File Upload Component with drag-and-drop support
 * Handles XLSX file validation and user feedback
 */

import React, { useCallback, useState } from 'react';
import { FileUploadProps } from '../types/services';

export const FileUploadComponent: React.FC<FileUploadProps> = ({
  onFileSelected,
  isProcessing,
  error
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileSelect = useCallback((file: File) => {
    if (file && !isProcessing) {
      onFileSelected(file);
    }
  }, [onFileSelected, isProcessing]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isProcessing) {
      setIsDragOver(true);
    }
  }, [isProcessing]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (isProcessing) return;

    const files = Array.from(e.dataTransfer.files);
    const file = files[0];
    
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect, isProcessing]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, [handleFileSelect]);

  const dropZoneClasses = [
    'border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200',
    'hover:border-blue-400 hover:bg-blue-50',
    isDragOver ? 'border-blue-500 bg-blue-100' : 'border-gray-300',
    isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
    error ? 'border-red-300 bg-red-50' : ''
  ].join(' ');

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={dropZoneClasses}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (!isProcessing) {
            document.getElementById('file-input')?.click();
          }
        }}
      >
        <input
          id="file-input"
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleInputChange}
          disabled={isProcessing}
          className="hidden"
        />

        <div className="space-y-4">
          {/* Upload Icon */}
          <div className="flex justify-center">
            {isProcessing ? (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            ) : (
              <svg
                className="h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>

          {/* Upload Text */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isProcessing ? 'Processing your file...' : 'Upload your Jira XLSX or CSV report'}
            </h3>
            
            {!isProcessing && (
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <span className="font-medium text-blue-600">Click to browse</span> or drag and drop your file here
                </p>
                <p>Supports .xlsx, .xls, and .csv files up to 50MB</p>
              </div>
            )}

            {isProcessing && (
              <p className="text-sm text-blue-600">
                Please wait while we process your Jira data...
              </p>
            )}
          </div>

          {/* File Requirements */}
          {!isProcessing && !error && (
            <div className="text-xs text-gray-500 bg-gray-50 rounded p-3">
              <h4 className="font-medium mb-1">File Requirements:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Export from Jira with ticket details</li>
                <li>Must include: Key, Summary, Issue Type, Status, Created date</li>
                <li>Optional: Story Points, Parent/Epic, Resolved date, Sprints</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Upload Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Processing Status */}
      {isProcessing && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                Processing your Jira data. This may take a few moments for large files.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};