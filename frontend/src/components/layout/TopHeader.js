import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const TopHeader = ({ title, showBack = false, rightAction = null, onBack = null }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  return (
    <header
      data-testid="top-header"
      className="sticky top-0 z-40 flex items-center justify-between h-14 px-4 border-b border-[hsl(var(--border))] bg-[hsl(var(--background)/0.75)] backdrop-blur supports-[backdrop-filter]:bg-[hsl(var(--background)/0.58)]"
    >
      <div className="flex items-center gap-2 min-w-[40px]">
        {showBack && (
          <Button
            variant="ghost"
            size="icon"
            data-testid="back-button"
            onClick={handleBack}
            className="h-9 w-9 rounded-full"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
      </div>
      <h1 className="text-base font-semibold tracking-tight truncate">
        {title}
      </h1>
      <div className="flex items-center gap-1 min-w-[40px] justify-end">
        {rightAction}
      </div>
    </header>
  );
};
