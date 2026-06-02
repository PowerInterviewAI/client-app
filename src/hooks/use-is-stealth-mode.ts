import { useEffect, useState } from 'react';

export default function useIsStealthMode(): boolean {
  const [isStealth, setIsStealth] = useState(false);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const update = () => setIsStealth(document.body.classList.contains('stealth'));
    update();

    const obs = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'attributes' && m.attributeName === 'class') {
          update();
          break;
        }
      }
    });

    try {
      obs.observe(document.body, { attributes: true });
    } catch (e) {
      console.error('useIsStealthMode: Failed to observe body class changes', e);
    }

    return () => {
      try {
        obs.disconnect();
      } catch (e) {
        console.error('useIsStealthMode: Failed to disconnect MutationObserver', e);
      }
    };
  }, []);

  return isStealth;
}
