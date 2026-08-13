import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MILESTONES, type Milestone } from '@pulso/shared';

const STORAGE_KEY = 'pulso.lastSeenStreakDays';

/** Detects a newly-crossed milestone since the last time this was checked — client-only, spec §7. */
export function useMilestoneCelebration(daysSmokeFree: number | undefined) {
  const [newlyUnlocked, setNewlyUnlocked] = useState<Milestone | null>(null);

  useEffect(() => {
    if (daysSmokeFree === undefined) return;
    let cancelled = false;

    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (cancelled) return;
      const lastSeen = stored ? Number(stored) : daysSmokeFree;
      const crossed = MILESTONES.filter((m) => lastSeen < m.days && daysSmokeFree >= m.days);
      if (crossed.length > 0) {
        setNewlyUnlocked(crossed[crossed.length - 1]);
      }
      AsyncStorage.setItem(STORAGE_KEY, String(daysSmokeFree));
    });

    return () => {
      cancelled = true;
    };
  }, [daysSmokeFree]);

  return { newlyUnlocked, dismiss: () => setNewlyUnlocked(null) };
}
