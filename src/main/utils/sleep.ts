export function safeSleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise<void>((resolve) => {
    if (signal?.aborted) return resolve();

    const id = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    function onAbort() {
      clearTimeout(id);
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }

    signal?.addEventListener('abort', onAbort);
  });
}
