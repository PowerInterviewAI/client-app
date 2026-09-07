import { useState } from 'react';

import { getElectron } from '@/lib/utils';
import type { ExportFormat } from '@/types/export';

export default function useTools() {
  const [exporting, setExporting] = useState(false);

  const exportTranscript = async (format: ExportFormat): Promise<string | null> => {
    setExporting(true);
    try {
      const electron = getElectron();
      if (!electron) {
        throw new Error('Electron API not available');
      }
      return await electron.tools.exportTranscript(format);
    } catch (error) {
      console.error('Failed to export transcript:', error);
      throw error;
    } finally {
      setExporting(false);
    }
  };

  const exportMockReport = async (format: ExportFormat): Promise<string | null> => {
    setExporting(true);
    try {
      const electron = getElectron();
      if (!electron) {
        throw new Error('Electron API not available');
      }
      return await electron.tools.exportMockReport(format);
    } catch (error) {
      console.error('Failed to export mock interview report:', error);
      throw error;
    } finally {
      setExporting(false);
    }
  };

  const clearAll = async () => {
    const electron = getElectron();
    if (!electron) {
      throw new Error('Electron API not available');
    }
    await electron.tools.clearAll();
  };

  const setPlaceholderData = async () => {
    const electron = getElectron();
    if (!electron) {
      throw new Error('Electron API not available');
    }
    await electron.tools.setPlaceholderData();
  };

  return {
    exporting,
    exportTranscript,
    exportMockReport,
    clearAll,
    setPlaceholderData,
  } as const;
}
