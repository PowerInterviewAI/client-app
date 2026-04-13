import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute right-0 top-0 h-full px-3 py-2"
        onClick={toggleShowPassword}
      >
        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>
    </div>
  );
}
