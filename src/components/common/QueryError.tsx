import { AlertCircle, RefreshCw } from 'lucide-react';

interface QueryErrorProps {
  message: string;
  onRetry?: () => void;
}

/**
 * Red alert box for displaying query errors to users.
 * Shows the error text so users can report it, plus an optional retry button.
 */
export function QueryError({ message, onRetry }: QueryErrorProps) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 p-4 rounded-lg border border-red-300 bg-red-50 text-red-800"
    >
      <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">Something went wrong</p>
        <p className="text-sm mt-1 break-words">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-red-300 rounded-md hover:bg-red-100 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          Retry
        </button>
      )}
    </div>
  );
}
