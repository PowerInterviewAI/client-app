/**
 * How much prose a suggestion carries. Mirrors `SuggestionMode` in src/main/types/llm.ts, wire
 * values included - see that file for why the strings still read `normal`/`professional`.
 */
export enum SuggestionMode {
  FullSentence = 'normal',
  HintOnly = 'professional',
}
