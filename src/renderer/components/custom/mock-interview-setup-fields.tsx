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
import { useT } from '@/i18n';
import { effectiveRate, minutesCovered, mockSessionMinutes } from '@/lib/credit-gate';
import { MockDifficulty, MockSeniority } from '@/types/mock-interview';

/**
 * The options, as enum values paired with the locale key that names them. The copy lives in
 * `t.mock.setup`, so adding a difficulty cannot leave its description behind in one language.
 */
const DIFFICULTIES = [
  { value: MockDifficulty.Easy, key: 'easy' },
  { value: MockDifficulty.Standard, key: 'standard' },
  { value: MockDifficulty.Hard, key: 'hard' },
] as const;

const SENIORITIES = [
  { value: MockSeniority.Junior, key: 'junior' },
  { value: MockSeniority.Mid, key: 'mid' },
  { value: MockSeniority.Senior, key: 'senior' },
  { value: MockSeniority.Staff, key: 'staff' },
] as const;

const QUESTION_COUNTS = [3, 5, 8, 12] as const;

/**
 * The form body shared by every place a mock interview is configured - seniority, question
 * count, difficulty, and the interview language.
 * Nothing here asks for the CV, job context or role: those come from the same account-level
 * `interviewConfig` the live assistant already reads. The backend frames the interview around
 * whatever role that context names, rather than a short label collected a second time here.
 */
export function MockInterviewSetupFields({ form }: { form: MockInterviewSetupForm }) {
  const t = useT();
  const {
    seniority,
    setSeniority,
    difficulty,
    setDifficulty,
    questionCount,
    setQuestionCount,
    credits,
    creditsPerMinute,
  } = form;

  const estimatedMinutes = mockSessionMinutes(questionCount);
  const coveredMinutes = credits === undefined ? null : minutesCovered(credits, creditsPerMinute);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          {/* A Radix Select trigger is a button, not a form control, so htmlFor does not reach
              it. id + aria-labelledby is what associates the two - see audio-group.tsx. */}
          <Label id="mock-seniority-label">{t.mock.setup.seniority}</Label>
          <Select value={seniority} onValueChange={(v) => setSeniority(v as MockSeniority)}>
            <SelectTrigger aria-labelledby="mock-seniority-label" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SENIORITIES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {t.mock.setup.seniorityOptions[s.key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label id="mock-question-count-label">{t.mock.setup.questions}</Label>
          <Select value={String(questionCount)} onValueChange={(v) => setQuestionCount(Number(v))}>
            <SelectTrigger aria-labelledby="mock-question-count-label" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {QUESTION_COUNTS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {t.mock.setup.questionOption(n, mockSessionMinutes(n))}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* An estimate, not a quote: a mock is billed by the minute for the time it takes, at the
          same rate as a live interview, and ends with its report when the credits run out. So no
          length is refused here - the candidate is told how far the balance goes instead. */}
      <p className="text-xs text-muted-foreground">
        {t.mock.setup.estimate(
          estimatedMinutes,
          estimatedMinutes * effectiveRate(creditsPerMinute)
        )}
        {coveredMinutes !== null && <> {t.mock.setup.covers(coveredMinutes)}</>}
        {coveredMinutes !== null && coveredMinutes < estimatedMinutes && (
          <> {t.mock.setup.endsEarly}</>
        )}
      </p>

      <div className="space-y-2">
        {/* No htmlFor: this labels the group via aria-labelledby below, not one control. */}
        <Label id="mock-difficulty-label">{t.mock.setup.difficulty}</Label>
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
                {t.mock.setup.difficultyOptions[d.key].label}
              </span>
              <span className="text-xs text-muted-foreground">
                {t.mock.setup.difficultyOptions[d.key].description}
              </span>
            </label>
          ))}
        </RadioGroup>
      </div>

      {/* The same control the configuration page and the wizard use, editing the same stored
          setting - a mock session reads the language the live assistant does. It used to be a
          read-only row here that told the user to go and change it on another screen, which is a
          strange thing to say on a dialog whose whole job is configuring the session. */}
      <LanguageField showVoice description={t.mock.setup.languageDescription} />
    </div>
  );
}
