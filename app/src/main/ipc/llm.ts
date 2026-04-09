import { ipcMain } from 'electron';

import { LLMApi } from '../api/llm.js';
import { LLMConfig } from '../types/llm.js';

const llmApi = new LLMApi();

export function registerLLMHandlers() {
  ipcMain.handle('llm:list-models', async () => {
    try {
      const response = await llmApi.listModels();
      if (response.error) {
        return { success: false, error: response.error.message };
      }
      return { success: true, data: response.data ?? [] };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list models',
      };
    }
  });

  ipcMain.handle('llm:validate', async (_event, config: LLMConfig | null) => {
    try {
      const response = await llmApi.validate({ config });
      if (response.error) {
        return { success: false, error: response.error.message };
      }
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to validate llm config',
      };
    }
  });
}
