'use client';

import { useEffect, useState } from 'react';
import { getMensajes } from '@/lib/sheets';

export function useMessagesCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const msgs = await getMensajes();
        setCount(msgs.filter(m => !m.respondido).length);
      } catch (e) {
        console.error(e);
      }
    }
    load();
    const interval = setInterval(load, 300000); // 5 min
    return () => clearInterval(interval);
  }, []);

  return count;
}
