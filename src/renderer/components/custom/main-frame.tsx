import React, { useEffect } from 'react';
import { toast } from 'sonner';

import { MainContainerContext } from '@/hooks/use-main-container';
import usePointerLockGuard from '@/hooks/use-pointer-lock-guard';
import type { PushNotification } from '@/types/push-notification';

import { CommandPalette } from './command-palette';
import SaveHistoryDialog from './save-history-dialog';
import Titlebar from './titlebar';
import { UpdateNotification } from './update-notification';

export default function MainFrame({ children }: { children: React.ReactNode }) {
  usePointerLockGuard();

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
    <MainContainerContext.Provider value={container}>
      <main ref={mainRef} className="relative overflow-hidden bg-background">
        <div className="flex flex-col h-dvh">
          <Titlebar />
          <div className="flex-1 flex flex-col overflow-auto hide-scrollbar">{children}</div>
        </div>
        <UpdateNotification />
      </main>

      {/* Mounted here rather than on the interview page: it also answers a close prompt from
          main, which can arrive while the user is on the login or payment route. */}
      <SaveHistoryDialog />
      {/* Mounted once at the app shell so Cmd/Ctrl+K and the titlebar button work from any
          route, not just /main. */}
      <CommandPalette />
    </MainContainerContext.Provider>
  );
}
