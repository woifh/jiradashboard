/**
 * Custom hook for using Web Workers with data processing
 */

import { useCallback, useRef } from 'react';

interface WorkerMessage {
  id: string;
  type: string;
  data?: any;
  progress?: number;
  stage?: string;
  error?: string;
}

interface UseWebWorkerOptions {
  onProgress?: (progress: number, stage?: string) => void;
  onError?: (error: string) => void;
}

export const useWebWorker = (workerPath: string, options: UseWebWorkerOptions = {}) => {
  const workerRef = useRef<Worker | null>(null);
  const callbacksRef = useRef<Map<string, (data: any) => void>>(new Map());

  const initWorker = useCallback(() => {
    if (!workerRef.current) {
      workerRef.current = new Worker(workerPath);
      
      workerRef.current.onmessage = (e: MessageEvent<WorkerMessage>) => {
        const { id, type, data, progress, stage, error } = e.data;

        switch (type) {
          case 'PROGRESS':
            if (options.onProgress && progress !== undefined) {
              options.onProgress(progress, stage);
            }
            break;
          
          case 'ERROR':
            if (options.onError && error) {
              options.onError(error);
            }
            // Clean up callback
            if (id) {
              callbacksRef.current.delete(id);
            }
            break;
          
          default:
            // Handle completion messages
            const callback = callbacksRef.current.get(id);
            if (callback) {
              callback(data);
              callbacksRef.current.delete(id);
            }
            break;
        }
      };

      workerRef.current.onerror = (error) => {
        if (options.onError) {
          options.onError(`Worker error: ${error.message}`);
        }
      };
    }
  }, [workerPath, options]);

  const postMessage = useCallback(<T>(
    type: string, 
    data: any, 
    callback?: (result: T) => void
  ): string => {
    initWorker();
    
    const id = Math.random().toString(36).substr(2, 9);
    
    if (callback) {
      callbacksRef.current.set(id, callback);
    }
    
    workerRef.current?.postMessage({ id, type, data });
    
    return id;
  }, [initWorker]);

  const terminate = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
      callbacksRef.current.clear();
    }
  }, []);

  return {
    postMessage,
    terminate,
    isSupported: typeof Worker !== 'undefined'
  };
};