import { LiveSuggestion, Speaker, Transcript } from '../types/app-state.js';
import { ExportFormat } from '../types/export.js';
import { Language } from '../types/language.js';
import { getExportLabels } from './export-labels.js';

interface ExportMarkdownInput {
  username: string;
  summary: string;
  transcripts: Transcript[];
  suggestions: LiveSuggestion[];
  /** Interview language. Decides the words this file adds around the model's summary. */
  language: Language;
}

/**
 * Builds the report every export format is rendered from. Kept free of any `electron` import so
 * it stays loadable outside an Electron process - see test/tools-export.test.mjs.
 */
export function buildExportMarkdown({
  username,
  summary,
  transcripts,
  suggestions,
  language,
}: ExportMarkdownInput): string {
  // The summary already arrives in the interview language, headings included - the summarize
  // prompt asks for that explicitly. These are the words this file adds on top of it, and
  // leaving them English is what made the export a half-translated document.
  const labels = getExportLabels(language);

  // Add Date/Time to summary (insert after first line)
  let summaryPart = summary;
  if (summaryPart) {
    const lines = summaryPart.split('\n');
    if (lines.length > 0) {
      const datetimeNow = new Date().toLocaleString();
      lines.splice(1, 0, `\n##### ${labels.dateTime}: ${datetimeNow}`);
      summaryPart = lines.join('\n');
    }
  }

  // Build Transcripts section
  const transcriptLines: string[] = [];
  for (const t of transcripts) {
    const timeStr = new Date(t.timestamp).toLocaleString();
    const speakerName = t.speaker === Speaker.Self ? username : labels.interviewer;
    transcriptLines.push(`#### ***${timeStr} | ${speakerName}***\n${t.text}\n`);
  }
  const transcriptsPart = `# **${labels.transcripts}**\n\n${transcriptLines.join('\n')}`;

  // Build Suggestions section
  const suggestionLines: string[] = [];
  for (const s of suggestions) {
    const timeStr = new Date(s.timestamp).toLocaleString();
    suggestionLines.push(
      `#### ***${timeStr} | ${labels.interviewer}***\n${s.last_question}\n\n#### ***${labels.suggestion}***\n${s.answer}\n`
    );
  }
  const suggestionsPart = `# **${labels.suggestions}**\n\n${suggestionLines.join('\n')}`;

  return `${summaryPart}\n\n${transcripts.length > 0 ? transcriptsPart : ''}\n\n${suggestions.length > 0 ? suggestionsPart : ''}`.trim();
}

export function generateExportFilename(format: ExportFormat, prefix: string = 'report'): string {
  const d = new Date();

  const pad = (n: number) => String(n).padStart(2, '0');

  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());
  const ss = pad(d.getSeconds());

  // Anything that is not an explicit `md` falls back to docx: `format` arrives over IPC from the
  // renderer, where the type annotation is erased, so an unexpected value must not reach the
  // extension.
  const ext = format === 'md' ? 'md' : 'docx';

  return `${prefix}-${yyyy}-${mm}-${dd}_${hh}-${min}-${ss}.${ext}`;
}
