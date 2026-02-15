import { AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export const ErrorState = ({ message = 'Something went wrong', onRetry }) => {
  return (
    <div data-testid="error-state" className="px-4 py-8">
      <Alert variant="destructive" className="bg-[hsl(var(--status-danger)/0.08)] border-[hsl(var(--status-danger)/0.2)]">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="ml-2 text-sm">
          {message}
        </AlertDescription>
      </Alert>
      {onRetry && (
        <div className="flex justify-center mt-4">
          <Button variant="secondary" size="sm" data-testid="retry-button" onClick={onRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      )}
    </div>
  );
};
