import { Loader, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppState } from '@/hooks/use-app-state';
import useTools from '@/hooks/use-tools';
import { RunningState } from '@/types/app-state';

interface ToolsGroupProps {
  getDisabled: (state: RunningState, disableOnRunning?: boolean) => boolean;
}

export function ToolsGroup({ getDisabled }: ToolsGroupProps) {
  const { runningState } = useAppState();
  const { exporting, exportTranscript, clearAll } = useTools();

  const onClearAll = async () => {
    try {
      await clearAll();
      toast.success('Everything cleared successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to clear');
    }
  };

  const onExportTranscript = async () => {
    try {
      await exportTranscript();
      toast.success('Interview exported successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to export interview');
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="secondary"
            onClick={onClearAll}
            size="sm"
            className="h-8 w-8 text-xs rounded-xl cursor-pointer"
            disabled={getDisabled(runningState) || exporting}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Clear All</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="secondary"
            onClick={onExportTranscript}
            size="sm"
            className="h-8 w-8 text-xs rounded-xl cursor-pointer"
            disabled={getDisabled(runningState) || exporting}
          >
            {exporting ? <Loader className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Export Interview</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
