'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function useAutoRefresh(intervalMs: number = 300000) { // 5 minutes default
  const router = useRouter();
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
      setLastRefresh(new Date());
    }, intervalMs);

    return () => clearInterval(interval);
  }, [router, intervalMs]);

  return { lastRefresh };
}
