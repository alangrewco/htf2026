let workerStartPromise: Promise<void> | null = null;

export const startMockWorker = () => {
  if (workerStartPromise) {
    return workerStartPromise;
  }

  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  workerStartPromise = (async () => {
    const [{ setupWorker }, { handlers }] = await Promise.all([
      import("msw/browser"),
      import("./handlers"),
    ]);
    const worker = setupWorker(...handlers);
    await worker.start({
      onUnhandledRequest: "bypass",
    });
  })().catch((error) => {
    workerStartPromise = null;
    throw error;
  });

  return workerStartPromise;
};
