import React from 'react';
import { FilterX } from 'lucide-react';

interface EmptyStateProps {
  message?: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  message = 'No clusters match these filters. Clear filters to see all.',
  actionText = 'Clear filters',
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-steel/30 rounded-lg bg-paper-card my-6">
      <div className="w-12 h-12 rounded-full bg-mist flex items-center justify-center mb-3">
        <FilterX className="w-6 h-6 text-steel" strokeWidth={1.5} />
      </div>
      <p className="text-14 text-ink font-medium max-w-sm mb-4">
        {message}
      </p>
      {onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 text-12 font-semibold text-petrol bg-petrol-subtle hover:bg-petrol-subtle/80 rounded transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
