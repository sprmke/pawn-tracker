import { Button } from '@/components/ui/button';
import { Filter, X } from 'lucide-react';
import { ReactNode } from 'react';
import { CollapsibleSection } from './collapsible-section';

interface FilterSectionProps {
  showMoreFilters: boolean;
  onToggleMoreFilters: () => void;
  hasActiveFilters: boolean;
  hasActiveAmountFilters: boolean;
  onClearFilters: () => void;
  children: ReactNode;
  moreFiltersContent?: ReactNode;
}

export function FilterSection({
  showMoreFilters,
  onToggleMoreFilters,
  hasActiveFilters,
  hasActiveAmountFilters,
  onClearFilters,
  children,
  moreFiltersContent,
}: FilterSectionProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Main filters row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {children}

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="whitespace-nowrap"
          >
            <X className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        )}
      </div>

      {/* More Filters - Collapsible Section */}
      {moreFiltersContent && (
        <CollapsibleSection
          isOpen={showMoreFilters}
          onToggle={onToggleMoreFilters}
          trigger={{
            label: `${showMoreFilters ? 'Less' : 'More'} Filters`,
            icon: Filter,
            showIndicator: hasActiveAmountFilters,
          }}
        >
          {moreFiltersContent}
        </CollapsibleSection>
      )}
    </div>
  );
}
