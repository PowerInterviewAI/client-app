import { FileIcon, FolderOpenIcon, Loader, RotateCcw, Save, XIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppState } from '@/hooks/use-app-state';
import useTools from '@/hooks/use-tools';
import { getElectron } from '@/lib/utils';
import { RunningState } from '@/types/app-state';

interface ToolsGroupProps {
  getDisabled: (state: RunningState, disableOnRunning?: boolean) => boolean;
}

export function ToolsGroup({ getDisabled }: ToolsGroupProps) {
  const { runningState } = useAppState();
  const { exporting, exportTranscript, setPlaceholderData } = useTools();

  const onResetAll = async () => {
    try {
      await setPlaceholderData();
    } catch (error) {
      console.error(error);
      toast.error('Failed to reset');
    }
  };

  const onExportTranscript = async () => {
    try {
      const filePath = await exportTranscript();
      if (!filePath) return;
      const electron = getElectron();
      const toastId = `export-${Date.now()}`;
      toast.success('Interview exported', {
        id: toastId,
        duration: 10_000,
        description: (
          <div className="flex gap-1.5 mt-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 px-2 text-xs gap-1"
                  onClick={() => electron?.openFile(filePath)}
                >
                  <FileIcon className="h-3 w-3" />
                  Open file
                </Button>
              </TooltipTrigger>
              <TooltipContent>Open the exported document</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 px-2 text-xs gap-1"
                  onClick={() => electron?.showInFolder(filePath)}
                >
                  <FolderOpenIcon className="h-3 w-3" />
                  Show in folder
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reveal in file explorer</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => toast.dismiss(toastId)}
                >
                  <XIcon className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Dismiss</TooltipContent>
            </Tooltip>
          </div>
        ),
      });
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
            onClick={onResetAll}
            size="sm"
            className="h-8 w-8 text-xs rounded-xl cursor-pointer"
            disabled={getDisabled(runningState) || exporting}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Reset All</p>
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
