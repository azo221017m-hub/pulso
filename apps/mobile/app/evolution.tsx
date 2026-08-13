import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { Pressable } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Lungs, useLungProgress, useReduceMotion } from '@/components/LungProgress';
import { estimateStreakDaysAtWeekEnd, getLungVisualState } from '@pulso/shared';
import type { LungProgressWeek } from '@pulso/shared';

export default function EvolutionScreen() {
  const { data, loading } = useLungProgress();
  const reduceMotion = useReduceMotion();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (loading || !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const lastIndex = data.weeklyTimeline.length - 1;
  const viewingIndex = selectedIndex ?? lastIndex;
  const viewingWeek = data.weeklyTimeline[viewingIndex];
  const isViewingCurrent = viewingIndex === lastIndex;
  const viewingDaysSmokeFree = isViewingCurrent
    ? data.daysSmokeFree
    : estimateStreakDaysAtWeekEnd(data.weeklyTimeline, viewingIndex);
  const viewingVisual = getLungVisualState(viewingDaysSmokeFree);
  const currentVisual = getLungVisualState(data.daysSmokeFree);
  const relapseWeeks = data.weeklyTimeline.filter((w) => w.relapses > 0);
  const justRelapsedToday = data.daysSmokeFree === 0 && data.relapseCount > 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Lungs
          size={180}
          progressRatio={viewingVisual.progressRatio}
          smokeOpacity={viewingVisual.smokeOpacity}
          particleCount={viewingVisual.particleCount}
          breathingSpeed={viewingVisual.breathingSpeed}
          reduceMotion={reduceMotion}
        />
        <Text style={styles.weekLabel}>
          {isViewingCurrent ? 'Ahora' : `Semana ${viewingWeek.weekNumber} — así estabas`}
        </Text>
        <Text style={styles.message}>{isViewingCurrent ? data.weekMessage : `${viewingDaysSmokeFree} días sin fumar en ese momento`}</Text>
      </View>

      {justRelapsedToday && (
        <View style={styles.relapseBanner}>
          <Text style={styles.relapseText}>Tu progreso no desapareció. Hoy tuviste una recaída. Continúa.</Text>
        </View>
      )}

      <View style={styles.statsRow}>
        <Stat label="Racha actual" value={`${data.daysSmokeFree} días`} />
        <Stat label="Cigarrillos evitados" value={String(data.cigarettesAvoided)} />
        <Stat label="Recaídas" value={String(data.relapseCount)} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mi evolución</Text>
        <View style={styles.timeline}>
          {data.weeklyTimeline.map((week, i) => (
            <Pressable
              key={week.weekNumber}
              style={styles.timelineRow}
              onPress={() => setSelectedIndex(i === lastIndex ? null : i)}>
              <Text style={[styles.timelineWeek, i === viewingIndex && styles.timelineWeekActive]}>
                SEMANA {week.weekNumber}
              </Text>
              <Text style={styles.timelineDot}>{week.completed ? '●' : '○'}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mira tu progreso</Text>
        <View style={styles.compareRow}>
          <View style={styles.compareCol}>
            <Lungs size={100} {...getLungVisualState(0)} reduceMotion={reduceMotion} />
            <Text style={styles.compareLabel}>Inicio</Text>
            <Text style={styles.compareSub}>Día 0</Text>
          </View>
          <View style={styles.compareCol}>
            <Lungs size={100} {...currentVisual} reduceMotion={reduceMotion} />
            <Text style={styles.compareLabel}>Ahora</Text>
            <Text style={styles.compareSub}>Día {data.daysSmokeFree}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hitos desbloqueados</Text>
        <View style={styles.milestoneGrid}>
          {data.milestones.map((m) => (
            <View key={m.days} style={[styles.milestone, !m.unlocked && styles.milestoneLocked]}>
              <Text style={styles.milestoneEmoji}>{m.unlocked ? m.emoji : '🔒'}</Text>
              <Text style={styles.milestoneLabel}>{m.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {relapseWeeks.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historial de recaídas</Text>
          {relapseWeeks.map((w: LungProgressWeek) => (
            <View key={w.weekNumber} style={styles.relapseRow}>
              <Text style={styles.relapseRowText}>
                Semana {w.weekNumber} — {w.relapses} {w.relapses === 1 ? 'cigarrillo' : 'cigarrillos'}
              </Text>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.disclaimer}>{data.medicalDisclaimer}</Text>
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, paddingBottom: 60, gap: 18 },
  hero: { alignItems: 'center', gap: 6, paddingVertical: 12 },
  weekLabel: { fontSize: 16, fontWeight: '700', marginTop: 8 },
  message: { fontSize: 14, opacity: 0.7, textAlign: 'center' },
  relapseBanner: { backgroundColor: '#FDECEC', borderRadius: 14, padding: 14 },
  relapseText: { fontSize: 14, lineHeight: 20 },
  statsRow: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, backgroundColor: '#F4F6FA', borderRadius: 14, padding: 12, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 11, opacity: 0.6, textAlign: 'center' },
  section: { gap: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  timeline: { gap: 4 },
  timelineRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  timelineWeek: { fontSize: 13, opacity: 0.6, letterSpacing: 0.5 },
  timelineWeekActive: { opacity: 1, fontWeight: '700' },
  timelineDot: { fontSize: 14 },
  compareRow: { flexDirection: 'row', justifyContent: 'space-around' },
  compareCol: { alignItems: 'center', gap: 2 },
  compareLabel: { fontSize: 14, fontWeight: '700', marginTop: 6 },
  compareSub: { fontSize: 12, opacity: 0.6 },
  milestoneGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  milestone: { width: '30%', backgroundColor: '#EEF3FF', borderRadius: 14, padding: 12, alignItems: 'center', gap: 4 },
  milestoneLocked: { backgroundColor: '#F4F6FA', opacity: 0.55 },
  milestoneEmoji: { fontSize: 22 },
  milestoneLabel: { fontSize: 11, textAlign: 'center', fontWeight: '600' },
  relapseRow: { paddingVertical: 6 },
  relapseRowText: { fontSize: 13, opacity: 0.7 },
  disclaimer: { fontSize: 11, opacity: 0.5, textAlign: 'center', marginTop: 8, lineHeight: 16 },
});
