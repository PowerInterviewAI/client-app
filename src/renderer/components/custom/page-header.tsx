import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';

interface PageHeaderProps {
  title: string;
  /** Where Back goes when there is no history to go back to. Home unless a page says otherwise. */
  fallback?: string;
  /** Tabs, actions - anything that belongs at the right end of the header row. */
  children?: ReactNode;
}

/**
 * The sticky header every routed destination in the app wears: back button, title, and whatever
 * the page puts at the right end.
 *
 * Shared rather than copied a fifth time. Each page used to own this row, and the back behaviour
 * in particular is not something worth re-deriving per page: a reload leaves the current page as
 * the first entry in the session history, where `navigate(-1)` has nowhere to go and silently
 * does nothing. React Router marks that entry with key 'default', which is what `fallback`
 * covers.
 */
export default function PageHeader({ title, fallback = '/', children }: PageHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (location.key === 'default') navigate(fallback, { replace: true });
    else navigate(-1);
  };

  return (
    <div className="sticky top-0 z-10 border-b bg-background px-4 py-2">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleBack}
          className="flex items-center shrink-0"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </Button>
        <h1 className="text-sm font-semibold shrink-0">{title}</h1>
        {children}
      </div>
    </div>
  );
}
