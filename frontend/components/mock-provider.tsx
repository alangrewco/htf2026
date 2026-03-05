"use client";

import { useEffect, useState } from "react";
import { startMockWorker } from "@/lib/msw/browser";

const shouldUseMsw =
  process.env.NEXT_PUBLIC_USE_MSW === "true" ||
  (process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_USE_MSW !== "false");

export function MockProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [ready, setReady] = useState(!shouldUseMsw);

  useEffect(() => {
    if (!shouldUseMsw) {
      return;
    }

    let mounted = true;

    const start = async () => {
      await startMockWorker();
      if (mounted) {
        setReady(true);
      }
    };

    void start();

    return () => {
      mounted = false;
    };
  }, []);

  if (!ready) {
    return null;
  }

  return <>{children}</>;
}
