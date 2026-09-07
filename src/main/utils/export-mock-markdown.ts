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
 *
 * **The heading levels are the live export's, not a second scheme.** Both documents are rendered
 * by the same `convertMarkdownToDocx` options (`MOCK_DOCX_OPTIONS` in `tools.service.ts`), which
 * centre H1 and H5 and leave everything else ranged left - a style sheet written for the live
 * report's shape: an H1 title, one centred H5 carrying the timestamp under it, and `#### ***…***`
 * for every labelled entry inside a section.
 *
 * This file used to ignore that and pick levels by depth instead: `##` for the score, `###` for
 * strengths, `####` for each question and `#####` for "Your Answer", "Score" and "Stronger
 * Answer". The last of those is what made the document look wrong rather than merely different -
 * H5 is *centred*, so three labels per question came out centred over left-ranged body text, and
 * a report with eight questions had two dozen of them. The title, meanwhile, was the one heading
 * that skipped the bold the live export gives it, so it rendered lighter than the score heading
 * below it.
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

  // Title and timestamp, in the two levels the docx style centres - the same pair the live
  // export produces by splicing its H5 date line under the summary's own H1.
  lines.push(`# **${labels.mockInterview}${role ? ` - ${role}` : ''}**`);
  lines.push('');
  lines.push(`##### ${labels.dateTime}: ${datetimeNow}`);
  lines.push('');

  if (report) {
    // The overall result is a section of the document, not a sub-heading of the title, so it
    // takes H1 like `# **Transcripts**` does in the live export. Strengths and gaps are its two
    // subsections and take H3: H2 is unused in both documents, and H4 is spoken for by the
    // entry-label idiom below.
    lines.push(`# **${labels.score}: ${report.overall_score}/100**`);
    lines.push('');
    if (report.strengths.length > 0) {
      lines.push(`### ${labels.strengths}`);
      lines.push('');
      for (const s of report.strengths) lines.push(`- ${s}`);
      lines.push('');
    }
    if (report.gaps.length > 0) {
      lines.push(`### ${labels.gaps}`);
      lines.push('');
      for (const g of report.gaps) lines.push(`- ${g}`);
      lines.push('');
    }
  }

  const entries: (MockQuestionScore | MockAnswer)[] = report?.questions.length
    ? report.questions
    : answers;

  entries.forEach((entry, index) => {
    // `#### ***…***` is the live export's label for one entry inside a section - it uses it for
    // every transcript turn and for every suggestion. A question, the answer to it, its score and
    // the rewritten answer are four such entries, so they all take it rather than descending a
    // level per nesting step and landing on the centred H5.
    lines.push(`#### ***${labels.question} ${index + 1}***`);
    lines.push('');
    lines.push(entry.question);
    lines.push('');
    lines.push(`#### ***${labels.yourAnswer}***`);
    lines.push('');
    // A turn can be answered and still empty - "Done answering" pressed with nothing transcribed,
    // or the silence backstop firing on a dead microphone - and a bare blank line under a label
    // reads as a truncated document rather than as what happened.
    lines.push(entry.answer || '-');
    lines.push('');
    if ('score' in entry) {
      lines.push(`#### ***${labels.score}: ${entry.score}/100***`);
      lines.push('');
      lines.push(entry.justification);
      lines.push('');
      lines.push(`#### ***${labels.strongerAnswer}***`);
      lines.push('');
      lines.push(entry.stronger_answer);
      lines.push('');
    }
  });

  return lines.join('\n').trim();
}
