import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useT } from '@/i18n';

interface InputPasswordProps extends React.InputHTMLAttributes<HTMLInputElement> {
  showPassword?: boolean;
  onToggleShowPassword?: () => void;
}

export function InputPassword({
  showPassword: externalShowPassword,
  onToggleShowPassword,
  className = '',
  ...props
}: InputPasswordProps) {
  const t = useT();
  const [internalShowPassword, setInternalShowPassword] = useState(false);

  const showPassword = externalShowPassword ?? internalShowPassword;
  const toggleShowPassword =
    onToggleShowPassword ?? (() => setInternalShowPassword(!internalShowPassword));

  return (
    <div className="relative">
      <Input
        type={showPassword ? 'text' : 'password'}
        className={`pr-10 ${className}`}
        {...props}
      />
      {/* The only control in the auth forms with no text of its own. Without a name it is
          announced as "button", on a field whose value is deliberately unreadable - and
          aria-pressed is what says which of the two states it is currently in. tabIndex -1
          keeps it out of the tab order between the password field and the submit button,
          where it is a stop that a keyboard user working through a form does not want. */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        tabIndex={-1}
        aria-label={showPassword ? t.inputPassword.hide : t.inputPassword.show}
        aria-pressed={showPassword}
        className="absolute right-0 top-0 h-full px-3 py-2"
        onClick={toggleShowPassword}
      >
        {showPassword ? (
          <EyeOff className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Eye className="h-4 w-4" aria-hidden="true" />
        )}
      </Button>
    </div>
  );
}
