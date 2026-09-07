import { convertMarkdownToDocx } from '@mohtasham/md-to-docx';
import { dialog } from 'electron';
import fs from 'fs/promises';

import { LLMApi } from '../api/llm.js';
import { configStore } from '../store/config.store.js';
import { ExportFormat } from '../types/export.js';
import { GenerateSummarizeRequest } from '../types/llm.js';
import { buildExportMarkdown, generateExportFilename } from '../utils/export-markdown.js';
import { buildMockExportMarkdown } from '../utils/export-mock-markdown.js';
import { appStateService } from './app-state.service.js';
import { mockInterviewService } from './mock-interview.service.js';
import { actionSuggestionService } from './suggestion-action.service.js';
import { liveSuggestionService } from './suggestion-live.service.js';
import { transcriptService } from './transcript.service.js';

/**
 * The Word style sheet both exports are rendered with.
 *
 * Named and shared rather than repeated at each call site: it is what decides that H1 and H5 are
 * centred and everything else is ranged left, which is the fact `export-markdown.ts` and
 * `export-mock-markdown.ts` both write their heading levels against. Two literals that happened
 * to agree is how the two documents would drift apart the first time one of them was tuned.
 */
const MOCK_DOCX_OPTIONS = {
  documentType: 'document',
  style: {
    heading1Alignment: 'CENTER',
    heading5Alignment: 'CENTER',
  },
} as const;

class ToolsService {
  private llmApi: LLMApi = new LLMApi();

  async exportTranscript(format: ExportFormat = 'docx'): Promise<string | null> {
    // Prepare request data
    const username = appStateService.getState().interviewConfig.fullName;
    const transcripts = appStateService.getState().transcripts;
    const suggestions = appStateService.getState().liveSuggestions;

    // Checked before the request, not after. Summarizing an empty interview is a billed model
    // call whose only possible output is invented, and it lands in a document the candidate is
    // told is a record of their interview. The export button is live whenever the assistant is
    // idle, which includes every launch before the first session.
    //
    // On `hasHistory` rather than on the array lengths: those are never zero, because the panels
    // are seeded with placeholder copy on launch and again after every Clear. So the length
    // check passed on a machine that had never run an interview, and the document it produced
    // was a model's summary of "Transcripts will be here".
    if (!appStateService.getState().hasHistory) {
      throw new Error('There is nothing to export yet. Run an interview first.');
    }

    // Call the API to generate the summary text
    const conf = configStore.getConfig();
    const response = await this.llmApi.generateSummary({
      username,
      transcripts,
      // The exported report is written in the interview's language too. A Spanish interview
      // summarised in English is a document the candidate cannot hand to anyone involved in it.
      language: conf.language,
    } as GenerateSummarizeRequest);
    if (response.error) {
      throw new Error(response.error.message);
    }

    const fullMarkdown = buildExportMarkdown({
      username,
      summary: response.data ?? '',
      transcripts,
      suggestions,
      // Same setting the summary was requested in, so the words this file adds around it are in
      // the language the rest of the document is written in.
      language: conf.language,
    });

    const isMarkdown = format === 'md';

    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Save Transcript',
      defaultPath: generateExportFilename(format),
      filters: isMarkdown
        ? [{ name: 'Markdown', extensions: ['md'] }]
        : [{ name: 'Word Document', extensions: ['docx'] }],
    });

    if (canceled || !filePath) return null;

    if (isMarkdown) {
      await fs.writeFile(filePath, fullMarkdown, 'utf8');
      return filePath;
    }

    const docxBlob = await convertMarkdownToDocx(fullMarkdown, MOCK_DOCX_OPTIONS);

    await fs.writeFile(filePath, Buffer.from(await docxBlob.arrayBuffer()));
    return filePath;
  }

  /**
   * Export the mock interview report - own guard, own filename prefix, own save dialog.
   *
   * Guarded on real answer content, the same standard `hasMockContent` uses, so this cannot bill
   * nothing into a document titled as a record of an interview that did not happen.
   */
  async exportMockReport(format: ExportFormat = 'docx'): Promise<string | null> {
    const session = mockInterviewService.getState();
    const hasContent = session.answers.some((a) => !a.skipped && a.answer.trim().length > 0);
    if (!hasContent || !session.setup) {
      throw new Error('There is nothing to export yet. Answer at least one question first.');
    }

    const fullMarkdown = buildMockExportMarkdown({
      setup: session.setup,
      answers: session.answers,
      report: session.report,
      language: mockInterviewService.getLanguage(),
    });

    const isMarkdown = format === 'md';

    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Save Mock Interview Report',
      defaultPath: generateExportFilename(format, 'mock-interview'),
      filters: isMarkdown
        ? [{ name: 'Markdown', extensions: ['md'] }]
        : [{ name: 'Word Document', extensions: ['docx'] }],
    });

    if (canceled || !filePath) return null;

    if (isMarkdown) {
      await fs.writeFile(filePath, fullMarkdown, 'utf8');
      mockInterviewService.markExported();
      return filePath;
    }

    const docxBlob = await convertMarkdownToDocx(fullMarkdown, MOCK_DOCX_OPTIONS);

    await fs.writeFile(filePath, Buffer.from(await docxBlob.arrayBuffer()));
    // After the write, never before it: a cancelled save dialog and a failed write both leave the
    // report in memory only, which is exactly when the save prompt still has something to ask.
    mockInterviewService.markExported();
    return filePath;
  }

  async clearAll(options: { includeActiveMockSession?: boolean } = {}): Promise<void> {
    // Clear in-memory state
    transcriptService.clear();
    liveSuggestionService.clear();
    actionSuggestionService.clear();

    // The mock session is in-memory state too, and leaving it here made "Clear" a lie about the
    // one subject it did not touch: `hasMockContent` stayed true, so the close guard kept asking
    // about a session that had been cleared and the save dialog - which picks the mock export
    // whenever mock content is the only content - would have written a report for it.
    //
    // Guarded on `isActive()` by default. The three in-app callers - the Clear button,
    // `startAssistant` opening a live session, and `useEndLiveSession` dropping a finished one -
    // only exist in a state a running mock session excludes, so for them this is belt: clearing
    // a session that is still running would drop the interview out from under the screen showing
    // it.
    //
    // Sign-out is the one caller for which that is not true, and it opts in: there is no screen
    // left to drop it out from under, and leaving it is how the next user on the machine ends up
    // being offered it.
    if (options.includeActiveMockSession || !mockInterviewService.isActive()) {
      mockInterviewService.clear();
    }
  }

  async setPlaceholderData(): Promise<void> {
    appStateService.setPlaceholderState();
  }
}

export const toolsService = new ToolsService();
