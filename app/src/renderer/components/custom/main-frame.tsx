import React, { useEffect } from 'react';
import { toast } from 'sonner';

import { MainContainerContext } from '@/components/ui/dialog';
import type { PushNotification } from '@/types/push-notification';

import Titlebar from './titlebar';
import { UpdateNotification } from './update-notification';

export default function MainFrame({ children }: { children: React.ReactNode }) {
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
    </MainContainerContext.Provider>
  );
}
