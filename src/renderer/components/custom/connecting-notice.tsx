import { Loader } from 'lucide-react';

export default function ConnectingNotice() {
  return (
    <div className="fixed top-11 left-1/2 -translate-x-1/2 bg-destructive/10 backdrop-blur-sm text-destructive text-xs font-medium px-4 py-1 rounded-full shadow-xl z-50 border border-destructive flex items-center gap-2 animate-pulse">
      <Loader className="size-3 animate-spin" />
      <span>Connecting to server…</span>
    </div>
  );
}
