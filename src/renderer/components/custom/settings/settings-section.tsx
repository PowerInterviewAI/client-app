import type { ReactNode } from 'react';

/**
 * A titled group on a settings-style page. The fields themselves are shared with the first-run
 * wizard and keep their own layout; this only gives the page a structure to scan.
 */
export function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2.5">
      <h2 className="px-1 text-[13px] font-semibold tracking-tight text-muted-foreground">
        {title}
      </h2>
      <div className="surface space-y-5 rounded-2xl p-5">{children}</div>
    </section>
  );
}
