import { CircleCheck, FileIcon, FolderOpenIcon, Loader, Save, Trash2, XIcon } from 'lucide-react';
import { useState } from 'react';
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
  const [clearing, setClearing] = useState(false);

  const onClear = async () => {
    setClearing(true);
    try {
      await setPlaceholderData();
      toast.success('Cleared');
    } catch (error) {
      console.error(error);
      toast.error('Failed to clear');
    } finally {
      setClearing(false);
    }
  };

  const onExportTranscript = async () => {
    try {
      const filePath = await exportTranscript();
      if (!filePath) return;
      const electron = getElectron();
      const toastId = `export-${Date.now()}`;
      toast.custom(
        () => (
          <div className="flex items-center gap-2 w-full px-4 py-3 rounded-lg border shadow-md" style={{ background: 'var(--success-bg)', borderColor: 'var(--success-border)', color: 'var(--success-text)' }}>
            <CircleCheck className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-sm font-medium">Interview exported</span>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={() => electron?.openFile(filePath)}>
                    <FileIcon className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Open file</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={() => electron?.showInFolder(filePath)}>
                    <FolderOpenIcon className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Show in folder</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => toast.dismiss(toastId)}>
                    <XIcon className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Dismiss</TooltipContent>
              </Tooltip>
            </div>
          </div>
        ),
        { id: toastId, duration: 10_000, style: { width: 'var(--width, 356px)' } }
      );
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
            onClick={onClear}
            size="sm"
            className="h-8 w-8 text-xs rounded-xl cursor-pointer"
            disabled={getDisabled(runningState) || exporting || clearing}
          >
            {clearing ? <Loader className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Clear</p>
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
