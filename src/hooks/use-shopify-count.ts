'use client';

import { useEffect, useState } from 'react';
import { getShopifyOrders } from '@/lib/sheets';

export function useShopifyCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const orders = await getShopifyOrders();
        setCount(orders.filter(o => o.estado === 'Nuevo').length);
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
