import { LanguageField } from '@/components/custom/settings/language-field';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { MockInterviewSetupForm } from '@/hooks/use-mock-interview-setup-form';
import { MockDifficulty, MockSeniority } from '@/types/mock-interview';

const DIFFICULTIES: { value: MockDifficulty; label: string; description: string }[] = [
  {
    value: MockDifficulty.Easy,
    label: 'Warm-up',
    description: 'Straightforward questions, one clear ask each.',
  },
  {
    value: MockDifficulty.Standard,
    label: 'Standard',
    description: 'What an ordinary interviewer would actually ask.',
  },
  {
    value: MockDifficulty.Hard,
    label: 'Hard',
    description: 'Probing questions on trade-offs and edge cases.',
  },
];

const SENIORITIES: { value: MockSeniority; label: string }[] = [
  { value: MockSeniority.Junior, label: 'Junior' },
  { value: MockSeniority.Mid, label: 'Mid-level' },
  { value: MockSeniority.Senior, label: 'Senior' },
  { value: MockSeniority.Staff, label: 'Staff+' },
];

const QUESTION_COUNTS = [3, 5, 8, 12] as const;

/**
 * The form body shared by every place a mock interview is configured - seniority, question
 * count, difficulty, and the interview language.
 * Nothing here asks for the CV, job context or role: those come from the same account-level
 * `interviewConfig` the live assistant already reads. The backend frames the interview around
 * whatever role that context names, rather than a short label collected a second time here.
 */
export function MockInterviewSetupFields({ form }: { form: MockInterviewSetupForm }) {
  const {
    seniority,
    setSeniority,
    difficulty,
    setDifficulty,
    questionCount,
    setQuestionCount,
    credits,
    priceOf,
    ceilingOf,
    canAfford,
  } = form;

  const price = priceOf(questionCount);
  const ceiling = ceilingOf(questionCount);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          {/* A Radix Select trigger is a button, not a form control, so htmlFor does not reach
              it. id + aria-labelledby is what associates the two - see audio-group.tsx. */}
          <Label id="mock-seniority-label">Seniority</Label>
          <Select value={seniority} onValueChange={(v) => setSeniority(v as MockSeniority)}>
            <SelectTrigger aria-labelledby="mock-seniority-label" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SENIORITIES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label id="mock-question-count-label">Questions</Label>
          <Select value={String(questionCount)} onValueChange={(v) => setQuestionCount(Number(v))}>
            <SelectTrigger aria-labelledby="mock-question-count-label" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {/* A length the balance cannot see through to its report is disabled rather than
                  left to be refused on Start, so the answer to "not enough credits" is a shorter
                  interview the user can pick right here instead of a dead end. */}
              {QUESTION_COUNTS.map((n) => (
                <SelectItem key={n} value={String(n)} disabled={!canAfford(n)}>
                  {n} questions, about {Math.round(n * 2.5)} minutes
                  {canAfford(n) ? '' : ' - not enough credits'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* What this will cost, before the candidate commits to it.
          Two numbers, and the smaller one is the promise: every question and the report are
          guaranteed once the session starts, and follow-ups are charged only as they are asked -
          the backend declines one rather than let it eat into the rest of the session. So the
          ceiling is the number you are never charged more than, not the one to expect.
          Nothing is shown at all against a backend that predates per-turn pricing, which still
          meters a mock by the minute and has no per-question price to quote. */}
      {price !== null && ceiling !== null && (
        <p className="text-xs text-muted-foreground">
          Costs <span className="font-medium text-foreground">{price} credits</span>
          {ceiling > price && <>, up to {ceiling} if the interviewer follows up on every answer</>}.
          You have {credits.toLocaleString()}.
        </p>
      )}

      <div className="space-y-2">
        {/* No htmlFor: this labels the group via aria-labelledby below, not one control. */}
        <Label id="mock-difficulty-label">Difficulty</Label>
        <RadioGroup
          aria-labelledby="mock-difficulty-label"
          value={difficulty}
          onValueChange={(v) => setDifficulty(v as MockDifficulty)}
          className="grid grid-cols-1 gap-2 sm:grid-cols-3"
        >
          {DIFFICULTIES.map((d) => (
            <label
              key={d.value}
              className="flex cursor-pointer flex-col gap-1 rounded-md border p-3 text-sm has-data-[state=checked]:border-primary"
            >
              <span className="flex items-center gap-2 font-medium">
                <RadioGroupItem value={d.value} />
                {d.label}
              </span>
              <span className="text-xs text-muted-foreground">{d.description}</span>
            </label>
          ))}
        </RadioGroup>
      </div>

      {/* The same control the configuration page and the wizard use, editing the same stored
          setting - a mock session reads the language the live assistant does. It used to be a
          read-only row here that told the user to go and change it on another screen, which is a
          strange thing to say on a dialog whose whole job is configuring the session. */}
      <LanguageField
        showVoice
        description="What the interviewer asks in, what is transcribed, and what your feedback comes back in."
      />
    </div>
  );
}
