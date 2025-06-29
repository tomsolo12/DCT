import { AlertTriangle, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ApiException } from "@/lib/api";

interface ErrorDisplayProps {
  error: Error | ApiException | unknown;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function ErrorDisplay({ error, onRetry, onDismiss, className }: ErrorDisplayProps) {
  const getErrorDetails = () => {
    if (error instanceof ApiException) {
      return {
        title: getErrorTitle(error.code),
        message: error.message,
        code: error.code,
        status: error.status,
        retryable: isRetryableError(error.code)
      };
    }
    
    if (error instanceof Error) {
      return {
        title: "Application Error",
        message: error.message,
        retryable: true
      };
    }
    
    return {
      title: "Unknown Error",
      message: "An unexpected error occurred",
      retryable: true
    };
  };

  const getErrorTitle = (code?: string): string => {
    switch (code) {
      case 'NETWORK_ERROR':
        return 'Connection Problem';
      case 'QUERY_TIMEOUT':
        return 'Query Timeout';
      case '401':
        return 'Authentication Required';
      case '403':
        return 'Access Denied';
      case '404':
        return 'Resource Not Found';
      case '500':
        return 'Server Error';
      default:
        return 'Error';
    }
  };

  const isRetryableError = (code?: string): boolean => {
    const nonRetryableCodes = ['401', '403', '404'];
    return !code || !nonRetryableCodes.includes(code);
  };

  const errorDetails = getErrorDetails();

  return (
    <Alert className={`border-red-200 bg-red-50 ${className}`}>
      <AlertTriangle className="h-4 w-4 text-red-600" />
      <AlertDescription className="flex-1">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="font-medium text-red-800 mb-1">
              {errorDetails.title}
            </div>
            <div className="text-red-700 text-sm mb-2">
              {errorDetails.message}
            </div>
            {errorDetails.code && (
              <div className="text-red-600 text-xs font-mono">
                Error Code: {errorDetails.code}
                {errorDetails.status && ` (HTTP ${errorDetails.status})`}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            {errorDetails.retryable && onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="h-7 px-2 text-xs border-red-300 text-red-700 hover:bg-red-100"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Retry
              </Button>
            )}
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="h-7 w-7 p-0 text-red-500 hover:bg-red-100"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}

// Hook for handling errors in React Query
export function useErrorHandler() {
  const handleError = (error: unknown, context?: string) => {
    console.error(`Error in ${context}:`, error);
    
    if (error instanceof ApiException) {
      // Could integrate with toast notifications or error tracking here
      return error;
    }
    
    return new ApiException(
      'An unexpected error occurred',
      'UNKNOWN_ERROR',
      error
    );
  };

  return { handleError };
}

// Loading skeleton component for better UX during data fetching
export function LoadingSkeleton({ 
  rows = 3, 
  className = "" 
}: { 
  rows?: number; 
  className?: string; 
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
        </div>
      ))}
    </div>
  );
}