import {
  BookOpen,
  CreditCard,
  Home,
  type LucideIcon,
  Monitor,
  Moon,
  SettingsIcon,
  Sun,
  UserRound,
} from 'lucide-react';
import { forwardRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { ThemeRadioItems } from '@/components/custom/theme-menu';
import TitlebarMenu from '@/components/custom/titlebar-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useInterviewLock } from '@/hooks/use-interview-lock';
import { useThemeStore } from '@/hooks/use-theme-store';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';

interface RailButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label: string;
  active?: boolean;
}

const RailButton = forwardRef<HTMLButtonElement, RailButtonProps>(
  ({ icon: Icon, label, active = false, className, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      {...props}
      className={cn(
        'relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors',
        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/60',
        'disabled:pointer-events-none disabled:opacity-40',
        active && 'bg-sidebar-accent text-sidebar-accent-foreground',
        className
      )}
    >
      {active && (
        <span
          aria-hidden="true"
          className="absolute -left-2 top-2 bottom-2 w-0.5 rounded-full bg-sidebar-primary"
        />
      )}
      <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
    </button>
  )
);
RailButton.displayName = 'RailButton';

interface RailItemProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

function RailItem({ icon, label, active, disabled, onClick }: RailItemProps) {
  const t = useT();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* Wrapped: a disabled button fires no pointer events, so without this the tooltip
            saying *why* it is disabled would be unreachable in the one state that needs it. */}
        <span className="inline-flex">
          <RailButton
            icon={icon}
            label={label}
            active={active}
            disabled={disabled}
            onClick={onClick}
          />
        </span>
      </TooltipTrigger>
      <TooltipContent side="right">
        <p>{label}</p>
        {disabled && (
          <p className="text-xs text-muted-foreground">{t.titlebar.unavailableDuringInterview}</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * The app's persistent navigation, an icon rail rather than a full sidebar so it costs 52px of an
 * 840px window. Labels live in tooltips; the active route is marked with an accent bar as well as
 * a fill, so it does not rely on colour alone.
 *
 * Disabled as a whole during an interview, the same rule the titlebar menu and the command palette
 * follow - the router would refuse each of these navigations anyway.
 */
export default function AppRail() {
  const t = useT();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { locked } = useInterviewLock();
  const preference = useThemeStore((s) => s.preference);
  const ThemeIcon = preference === 'system' ? Monitor : preference === 'light' ? Sun : Moon;

  const items: { path: string; icon: LucideIcon; label: string }[] = [
    { path: '/', icon: Home, label: t.titlebarMenu.home },
    { path: '/configuration', icon: SettingsIcon, label: t.titlebarMenu.configuration },
    { path: '/account', icon: UserRound, label: t.titlebarMenu.account },
    { path: '/payment', icon: CreditCard, label: t.home.subscribe },
    { path: '/documentation', icon: BookOpen, label: t.titlebarMenu.documentation },
  ];

  return (
    <nav
      aria-label={t.titlebar.menu}
      className="flex w-[52px] shrink-0 flex-col items-center gap-1 border-r border-sidebar-border bg-sidebar py-3"
    >
      {items.map((item) => (
        <RailItem
          key={item.path}
          icon={item.icon}
          label={item.label}
          active={pathname === item.path}
          disabled={locked}
          onClick={() => pathname !== item.path && navigate(item.path)}
        />
      ))}

      <div className="mt-auto flex flex-col items-center gap-1">
        {/* Non-modal for the same reason as the account menu: a modal menu locks pointer events
            on the body, and that lock can outlive a menu its own action unmounts. */}
        <DropdownMenu modal={false}>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <RailButton icon={ThemeIcon} label={t.titlebarMenu.theme} />
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{t.titlebarMenu.theme}</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent side="right" align="end" className="min-w-44">
            <DropdownMenuLabel>{t.titlebarMenu.theme}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <ThemeRadioItems />
          </DropdownMenuContent>
        </DropdownMenu>
        <TitlebarMenu placement="rail" disabled={locked} />
      </div>
    </nav>
  );
}
