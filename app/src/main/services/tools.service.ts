import { convertMarkdownToDocx } from '@mohtasham/md-to-docx';
import { dialog } from 'electron';
import fs from 'fs/promises';

import { ApiClient } from '../api/client.js';
import { configStore } from '../store/config.store.js';
import { Speaker, Transcript } from '../types/app-state.js';
import { appStateService } from './app-state.service.js';
import { actionSuggestionService } from './suggestion.action.service.js';
import { liveSuggestionService } from './suggestion.live.service.js';
import { transcriptService } from './transcript.service.js';

interface GenerateSummarizeRequest {
  username: string;
  transcripts: Transcript[];
}

class ToolsService {
  private apiClient: ApiClient = new ApiClient();

  private generateFilename(): string {
    const d = new Date();

    const pad = (n: number) => String(n).padStart(2, '0');

    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const min = pad(d.getMinutes());
    const ss = pad(d.getSeconds());

    return `report-${yyyy}-${mm}-${dd}_${hh}-${min}-${ss}.docx`;
  }

  async exportTranscript(): Promise<void> {
    // Prepare request data
    const username = configStore.getConfig().interviewConf.username;
    const transcripts = appStateService.getState().transcripts;
    const suggestions = appStateService.getState().liveSuggestions;

    // Call the API to generate the summary text
    const response = await this.apiClient.post<string>('/api/llm/summarize', {
      username,
      transcripts,
    } as GenerateSummarizeRequest);
    if (response.error) {
      throw new Error(response.error.message);
    }

    const summaryPartRaw = response.data ?? '';

    // Add Date/Time to summary (insert after first line)
    let summaryPart = summaryPartRaw;
    if (summaryPart) {
      const lines = summaryPart.split('\n');
      if (lines.length > 0) {
        const datetimeNow = new Date().toLocaleString();
        lines.splice(1, 0, `\n##### Date/Time: ${datetimeNow}`);
        summaryPart = lines.join('\n');
      }
    }

    // Build Transcripts section
    const transcriptLines: string[] = [];
    for (const t of transcripts) {
      const timeStr = new Date(t.timestamp).toLocaleString();
      const speakerName = t.speaker === Speaker.Self ? username : 'Interviewer';
      transcriptLines.push(`#### ***${timeStr} | ${speakerName}***\n${t.text}\n`);
    }
    const transcriptsPart = `# **Transcripts**\n\n${transcriptLines.join('\n')}`;

    // Build Suggestions section
    const suggestionLines: string[] = [];
    for (const s of suggestions) {
      const timeStr = new Date(s.timestamp).toLocaleString();
      suggestionLines.push(
        `#### ***${timeStr} | Interviewer***\n${s.last_question}\n\n#### ***Suggestion***\n${s.answer}\n`
      );
    }
    const suggestionsPart = `# **Suggestions**\n\n${suggestionLines.join('\n')}`;

    // Combine all parts into final Markdown content
    const fullMarkdown =
      `${summaryPart}\n\n${transcripts.length > 0 ? transcriptsPart : ''}\n\n${suggestions.length > 0 ? suggestionsPart : ''}`.trim();

    // Convert Markdown to DOCX
    const docxBlob = await convertMarkdownToDocx(fullMarkdown, {
      documentType: 'document',
      style: {
        heading1Alignment: 'CENTER',
        heading5Alignment: 'CENTER',
      },
    });

    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Save Transcript',
      defaultPath: this.generateFilename(),
      filters: [{ name: 'Word Document', extensions: ['docx'] }],
    });

    if (canceled || !filePath) return;

    await fs.writeFile(filePath, Buffer.from(await docxBlob.arrayBuffer()));
  }

  async clearAll(): Promise<void> {
    // Clear in-memory state
    transcriptService.clear();
    liveSuggestionService.clear();
    actionSuggestionService.clear();
  }

  async setPlaceholderData(): Promise<void> {
    appStateService.setPlaceholderState();
  }
}

export const toolsService = new ToolsService();
