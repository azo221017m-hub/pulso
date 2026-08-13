import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { api } from '@/lib/api';
import type { LungProgressResponse } from '@pulso/shared';

export function useLungProgress() {
  const [data, setData] = useState<LungProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      api
        .get<LungProgressResponse>('/metrics/lung-progress')
        .then((res) => {
          if (!cancelled) setData(res);
        })
        .finally(() => !cancelled && setLoading(false));
      return () => {
        cancelled = true;
      };
    }, []),
  );

  return { data, loading };
}
