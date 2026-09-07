import { Language } from '../types/language.js';
import {
  MockAnswer,
  MockInterviewSetup,
  MockQuestionScore,
  MockReport,
} from '../types/mock-interview.js';
import { getExportLabels } from './export-labels.js';

interface ExportMockMarkdownInput {
  setup: MockInterviewSetup;
  answers: MockAnswer[];
  report: MockReport | null;
  language: Language;
}

/**
 * Builds the mock-interview report every export format is rendered from.
 *
 * Kept free of any `electron` import, the same constraint `export-markdown.ts` carries, so it
 * stays loadable outside an Electron process for a `.test.mjs` file to exercise directly.
 *
 * Reads from `report.questions` when scoring succeeded (it carries the scores and the stronger
 * answers) and falls back to the raw `answers` when it did not - the transcript is still worth
 * exporting even when the model failed to score it.
 */
export function buildMockExportMarkdown({
  setup,
  answers,
  report,
  language,
}: ExportMockMarkdownInput): string {
  const labels = getExportLabels(language);
  const datetimeNow = new Date().toLocaleString();

  // The role is optional and the setup form no longer collects one, so the suffix is conditional:
  // interpolating it unconditionally titled every exported report "Mock interview - undefined",
  // in the one artifact of this feature that leaves the machine and is read by someone else.
  const role = setup.role?.trim();

  const lines: string[] = [];
  lines.push(`# ${labels.mockInterview}${role ? ` - ${role}` : ''}`);
  lines.push(`##### ${labels.dateTime}: ${datetimeNow}`);
  lines.push('');

  if (report) {
    lines.push(`## ${labels.score}: ${report.overall_score}/100`);
    lines.push('');
    if (report.strengths.length > 0) {
      lines.push(`### ${labels.strengths}`);
      for (const s of report.strengths) lines.push(`- ${s}`);
      lines.push('');
    }
    if (report.gaps.length > 0) {
      lines.push(`### ${labels.gaps}`);
      for (const g of report.gaps) lines.push(`- ${g}`);
      lines.push('');
    }
  }

  const entries: (MockQuestionScore | MockAnswer)[] = report?.questions.length
    ? report.questions
    : answers;

  entries.forEach((entry, index) => {
    lines.push(`#### ${labels.question} ${index + 1}`);
    lines.push(entry.question);
    lines.push('');
    lines.push(`##### ${labels.yourAnswer}`);
    lines.push(entry.answer || '-');
    lines.push('');
    if ('score' in entry) {
      lines.push(`##### ${labels.score}: ${entry.score}/100`);
      lines.push(entry.justification);
      lines.push('');
      lines.push(`##### ${labels.strongerAnswer}`);
      lines.push(entry.stronger_answer);
      lines.push('');
    }
  });

  return lines.join('\n').trim();
}
