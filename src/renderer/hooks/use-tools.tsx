import { useState } from 'react';

import { getElectron } from '@/lib/utils';

export default function useTools() {
  const [exporting, setExporting] = useState(false);

  const exportTranscript = async (): Promise<string | null> => {
    setExporting(true);
    try {
      const electron = getElectron();
      if (!electron) {
        throw new Error('Electron API not available');
      }
      return await electron.tools.exportTranscript();
    } catch (error) {
      console.error('Failed to export transcript:', error);
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
    clearAll,
    setPlaceholderData,
  } as const;
}
