/**
 * Export is assembled as Markdown and only then converted, so the same string is what a .md
 * export writes verbatim and what the .docx converter is fed. These pin that assembly and the
 * filename extension, which is what decides the format the save dialog offers.
 *
 * Only the pure helpers are covered - exportTranscript() itself needs `dialog` and the LLM API,
 * neither of which the electron stub provides.
 */
import { createChecker, loadMain } from './helpers.mjs';

export async function run() {
  const { check, failures } = createChecker('tools-export');

  const { buildExportMarkdown, generateExportFilename } = await loadMain(
    'utils/export-markdown.js'
  );
  const { getExportLabels, hasTranslatedExportLabels } = await loadMain('utils/export-labels.js');
  const { Language } = await loadMain('types/language.js');

  const transcripts = [
    { timestamp: Date.now(), text: 'I led the migration.', speaker: 'self' },
    { timestamp: Date.now(), text: 'Tell me about a hard bug.', speaker: 'other' },
  ];
  const suggestions = [
    { timestamp: Date.now(), last_question: 'Why did you leave?', answer: 'Growth.' },
  ];

  const md = buildExportMarkdown({
    username: 'Ada Lovelace',
    summary: '# **Report**\nBody text.',
    transcripts,
    suggestions,
    language: Language.English,
  });

  check('keeps the summary', md.includes('# **Report**'));
  check('stamps the export time under the title', md.includes('##### Date/Time:'));
  check('emits the transcripts section', md.includes('# **Transcripts**'));
  check('emits the suggestions section', md.includes('# **Suggestions**'));
  check('labels the candidate by name', md.includes('| Ada Lovelace***'));
  check('labels everyone else as the interviewer', md.includes('| Interviewer***'));
  check(
    'carries the question and the suggested answer',
    md.includes('Why did you leave?') && md.includes('Growth.')
  );

  const empty = buildExportMarkdown({
    username: 'Ada Lovelace',
    summary: '# **Report**',
    transcripts: [],
    suggestions: [],
    language: Language.English,
  });
  check('omits the transcripts heading when there are none', !empty.includes('# **Transcripts**'));
  check('omits the suggestions heading when there are none', !empty.includes('# **Suggestions**'));

  // The report is the one part of this app that is deliberately not in English. The summarize
  // prompt translates the headings it writes; everything this file adds around them used to stay
  // English, which produced the half-translated document that prompt exists to avoid.
  const es = getExportLabels(Language.Spanish);
  const spanish = buildExportMarkdown({
    username: 'Ada Lovelace',
    summary: '# **Informe**',
    transcripts,
    suggestions,
    language: Language.Spanish,
  });
  check(
    'the transcripts heading follows the interview language',
    spanish.includes(`# **${es.transcripts}**`)
  );
  check('the suggestions heading follows it too', spanish.includes(`# **${es.suggestions}**`));
  check('the suggestion sub-heading follows it', spanish.includes(`***${es.suggestion}***`));
  check('the interviewer is attributed in it', spanish.includes(`| ${es.interviewer}***`));
  check('the export timestamp is labelled in it', spanish.includes(`##### ${es.dateTime}:`));
  check('no English scaffolding survives', !spanish.includes('# **Transcripts**'));
  check('the candidate is still named, not translated', spanish.includes('| Ada Lovelace***'));

  // Every enum member needs an entry: a missing one is a report that is Japanese apart from the
  // five words this file contributes.
  check(
    'every language has a full set of labels',
    Object.values(Language).every((code) => {
      const labels = getExportLabels(code);
      return ['transcripts', 'suggestions', 'suggestion', 'interviewer', 'dateTime'].every(
        (key) => typeof labels?.[key] === 'string' && labels[key].length > 0
      );
    })
  );

  // An English fallback would satisfy the check above for every language, so it says nothing about
  // translation. The fallback list is a type in export-labels.ts; this pins the other half - that
  // the major languages, the ones most reports are in, are never quietly on it.
  check(
    'the major languages have labels of their own',
    [
      'es',
      'de',
      'fr',
      'pt',
      'ru',
      'ja',
      'zh',
      'zh-hk',
      'zh-tw',
      'ko',
      'hi',
      'bn',
      'ur',
      'fa',
      'ar',
      'tr',
      'vi',
      'id',
    ].every((code) => hasTranslatedExportLabels(code))
  );
  check(
    'a low-resource language falls back to English on purpose',
    !hasTranslatedExportLabels('ab') && getExportLabels('ab').transcripts === 'Transcripts'
  );

  // Resolved rather than thrown on. `configStore.getConfig()` already stops an unknown code, so
  // this is the belt over that brace - and an English heading beats an export that fails.
  check(
    'an unknown language falls back to English rather than throwing',
    getExportLabels('kl').transcripts === 'Transcripts'
  );

  const docxName = generateExportFilename('docx');
  const mdName = generateExportFilename('md');
  check('names the Word export .docx', docxName.endsWith('.docx'));
  check('names the Markdown export .md', mdName.endsWith('.md'));
  check(
    'keeps the report-<timestamp> stem',
    /^report-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.(docx|md)$/.test(mdName)
  );
  // `format` crosses IPC from the renderer, where the type annotation is erased.
  check(
    'falls back to docx for an unknown format',
    generateExportFilename('exe').endsWith('.docx')
  );

  return failures;
}
