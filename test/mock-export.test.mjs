/**
 * The mock-interview report is assembled as Markdown the same way the live export is - see
 * tools-export.test.mjs - and carries the same requirement that every language in the picker has
 * a full set of labels, not just the ones exercised by hand during development.
 */
import { createChecker, loadMain } from './helpers.mjs';

export async function run() {
  const { check, failures } = createChecker('mock-export');

  const { buildMockExportMarkdown } = await loadMain('utils/export-mock-markdown.js');
  const { getExportLabels } = await loadMain('utils/export-labels.js');
  const { Language } = await loadMain('types/language.js');

  const setup = {
    role: 'Backend Engineer',
    seniority: 'mid',
    difficulty: 'standard',
    question_count: 2,
  };

  const withReport = buildMockExportMarkdown({
    setup,
    answers: [
      {
        question: 'Tell me about yourself.',
        kind: 'behavioral',
        answer: 'I am an engineer.',
        skipped: false,
      },
    ],
    report: {
      overall_score: 82,
      strengths: ['Clear communication'],
      gaps: ['Limited depth on scaling'],
      questions: [
        {
          question: 'Tell me about yourself.',
          answer: 'I am an engineer.',
          score: 82,
          justification: 'Concise and relevant.',
          stronger_answer: 'A fuller answer with more detail.',
        },
      ],
    },
    language: Language.English,
  });

  check(
    'titles the document with the role',
    withReport.includes('Mock Interview - Backend Engineer')
  );

  // The setup form no longer collects a role, so this is what every real export now takes. The
  // suffix has to disappear with it rather than interpolating the absent value: the shipped
  // build titled every report "Mock Interview - undefined" until this was made conditional.
  const withoutRole = buildMockExportMarkdown({
    setup: { seniority: 'mid', difficulty: 'standard', question_count: 2 },
    answers: [
      {
        question: 'Tell me about yourself.',
        kind: 'behavioral',
        answer: 'I am an engineer.',
        skipped: false,
      },
    ],
    report: null,
    language: Language.English,
  });

  check('a missing role does not reach the title', !withoutRole.includes('undefined'));
  check('and leaves no dangling separator', withoutRole.includes('# Mock Interview\n'));
  const withBlankRole = buildMockExportMarkdown({
    setup: { role: '   ', seniority: 'mid', difficulty: 'standard', question_count: 2 },
    answers: [],
    report: null,
    language: Language.English,
  });

  check('a blank role is treated as absent', withBlankRole.includes('# Mock Interview\n'));
  check('includes the overall score', withReport.includes('Score: 82/100'));
  check('includes strengths', withReport.includes('Clear communication'));
  check('includes gaps', withReport.includes('Limited depth on scaling'));
  check('includes the question', withReport.includes('Tell me about yourself.'));
  check('includes the stronger answer', withReport.includes('A fuller answer with more detail.'));

  // A failed report still exports the raw transcript - the terminal-state invariant's visible
  // form. No score section, no stronger-answer section, but the Q&A itself must survive.
  const withoutReport = buildMockExportMarkdown({
    setup,
    answers: [
      {
        question: 'Tell me about yourself.',
        kind: 'behavioral',
        answer: 'I am an engineer.',
        skipped: false,
      },
    ],
    report: null,
    language: Language.English,
  });
  check(
    'a missing report still includes the question',
    withoutReport.includes('Tell me about yourself.')
  );
  check('a missing report still includes the answer', withoutReport.includes('I am an engineer.'));
  check('a missing report has no score section', !withoutReport.includes('Score:'));

  // A skipped question has no answer text - '-' rather than an empty line, so the document does
  // not read as truncated.
  const withSkip = buildMockExportMarkdown({
    setup,
    answers: [{ question: 'Skipped one.', kind: 'technical', answer: '', skipped: true }],
    report: null,
    language: Language.English,
  });
  check('a skipped question renders a placeholder rather than nothing', withSkip.endsWith('\n-'));

  // Every language the picker offers needs the full extended label set - a missing field would
  // fall back silently to undefined appearing in the document rather than throwing.
  const requiredFields = [
    'transcripts',
    'suggestions',
    'suggestion',
    'interviewer',
    'dateTime',
    'mockInterview',
    'question',
    'yourAnswer',
    'score',
    'strengths',
    'gaps',
    'strongerAnswer',
  ];
  for (const code of Object.values(Language)) {
    const labels = getExportLabels(code);
    check(
      `${code} has every export label`,
      requiredFields.every((field) => typeof labels[field] === 'string' && labels[field].length > 0)
    );
  }

  return failures;
}
