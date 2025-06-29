import { useState, useEffect } from "react";
import { Clock, AlertTriangle, CheckCircle } from "lucide-react";

interface PerformanceMonitorProps {
  isLoading: boolean;
  startTime?: number;
  threshold?: number; // milliseconds
  className?: string;
}

export function PerformanceMonitor({ 
  isLoading, 
  startTime, 
  threshold = 5000,
  className = "" 
}: PerformanceMonitorProps) {
  const [elapsed, setElapsed] = useState(0);
  const [isSlowOperation, setIsSlowOperation] = useState(false);

  useEffect(() => {
    if (!isLoading || !startTime) {
      setElapsed(0);
      setIsSlowOperation(false);
      return;
    }

    const interval = setInterval(() => {
      const currentElapsed = Date.now() - startTime;
      setElapsed(currentElapsed);
      
      if (currentElapsed > threshold) {
        setIsSlowOperation(true);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isLoading, startTime, threshold]);

  if (!isLoading && elapsed === 0) return null;

  const getStatusIcon = () => {
    if (isLoading) {
      return isSlowOperation ? 
        <AlertTriangle className="w-4 h-4 text-amber-500" /> : 
        <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
    }
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  const getStatusMessage = () => {
    if (isLoading) {
      return isSlowOperation ? 
        "Operation taking longer than expected..." : 
        "Processing...";
    }
    return `Completed in ${(elapsed / 1000).toFixed(1)}s`;
  };

  const getStatusColor = () => {
    if (isLoading) {
      return isSlowOperation ? "text-amber-600" : "text-blue-600";
    }
    return "text-green-600";
  };

  return (
    <div className={`flex items-center space-x-2 text-xs ${getStatusColor()} ${className}`}>
      {getStatusIcon()}
      <span>{getStatusMessage()}</span>
      {elapsed > 0 && (
        <span className="font-mono">
          {(elapsed / 1000).toFixed(1)}s
        </span>
      )}
    </div>
  );
}

// Enhanced loading spinner with progress indication
export function ProgressiveLoader({ 
  stage, 
  stages,
  className = ""
}: {
  stage: number;
  stages: string[];
  className?: string;
}) {
  const progress = (stage / stages.length) * 100;

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-sm text-gray-600">{stages[stage] || "Processing..."}</span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      <div className="text-xs text-gray-500">
        Step {stage + 1} of {stages.length}
      </div>
    </div>
  );
}

// Throttled data fetcher for performance optimization
export function useThrottledQuery<T>(
  queryFn: () => Promise<T>,
  dependencies: any[],
  throttleMs: number = 1000
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastFetch, setLastFetch] = useState(0);

  useEffect(() => {
    const now = Date.now();
    if (now - lastFetch < throttleMs) return;

    setIsLoading(true);
    setError(null);
    setLastFetch(now);

    queryFn()
      .then(result => {
        setData(result);
        setError(null);
      })
      .catch(err => {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [...dependencies]);

  return { data, isLoading, error, refetch: queryFn };
}