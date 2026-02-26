import React, { useEffect } from 'react';
import { toast } from 'sonner';

import { DialogContainerContext } from '@/components/ui/dialog';
import useIsStealthMode from '@/hooks/use-is-stealth-mode';
import type { PushNotification } from '@/types/push-notification';

import Titlebar from './titlebar';
import { UpdateNotification } from './update-notification';
import WindowResizer from './window-resizer';

export default function MainFrame({ children }: { children: React.ReactNode }) {
  const isStealth = useIsStealthMode();
  const [container, setContainer] = React.useState<HTMLElement | null>(null);
  const mainRef = React.useCallback((el: HTMLElement | null) => {
    setContainer(el);
  }, []);

  useEffect(() => {
    const api = window.electronAPI;
    if (!api?.onPushNotification) return;

    const remove = api.onPushNotification((notification: PushNotification) => {
      try {
        const msg = notification.message;
        const type = notification.type;

        if (type === 'error') toast.error(msg);
        else if (type === 'info') toast.info(msg);
        else if (type === 'success') toast.success(msg);
        else if (type === 'warning') toast.warning(msg);
        else toast(msg);
      } catch (e) {
        console.warn('push notification handler error', e);
      }
    });

    return () => remove?.();
  }, []);

  return (
    <DialogContainerContext.Provider value={container}>
      <main
        ref={mainRef}
        className={`relative overflow-hidden bg-background ${isStealth ? 'border-2 border-blue-500 rounded-2xl' : 'border border-foreground/30 rounded-xl'} `}
      >
        <div className="flex flex-col h-[calc(100vh-4px)]">
          <Titlebar />
          <div className="flex-1 flex flex-col overflow-auto hide-scrollbar">{children}</div>
        </div>
        <WindowResizer />
        <UpdateNotification />
      </main>
    </DialogContainerContext.Provider>
  );
}
