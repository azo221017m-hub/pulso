import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { api } from '@/lib/api';
import type { TodayLungState } from '@pulso/shared';

export function useTodayLungState() {
  const [data, setData] = useState<TodayLungState | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    return api
      .get<TodayLungState>('/metrics/today')
      .then((res) => setData(res))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      api
        .get<TodayLungState>('/metrics/today')
        .then((res) => {
          if (!cancelled) setData(res);
        })
        .finally(() => !cancelled && setLoading(false));
      return () => {
        cancelled = true;
      };
    }, []),
  );

  return { data, loading, reload };
}
