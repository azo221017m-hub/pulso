import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { api } from '@/lib/api';
import { LungProgressCard } from '@/components/LungProgress';
import type { DashboardMetrics, InsightsResponse } from '@pulso/shared';

export default function DashboardScreen() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      Promise.all([api.get<DashboardMetrics>('/metrics/dashboard'), api.get<InsightsResponse>('/metrics/insights')])
        .then(([m, i]) => {
          if (cancelled) return;
          setMetrics(m);
          setInsights(i.insights);
        })
        .finally(() => !cancelled && setLoading(false));
      return () => {
        cancelled = true;
      };
    }, []),
  );

  if (loading || !metrics) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Tu progreso</Text>

      <LungProgressCard />

      <View style={styles.card}>
        <Text style={styles.cardEmoji}>🏆</Text>
        <Text style={styles.cardValue}>{metrics.momentsOvercomeCount}</Text>
        <Text style={styles.cardLabel}>Momentos que superaste</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardEmoji}>🧠</Text>
        <Text style={styles.cardValue}>{metrics.pulsoAnticipatedCount}</Text>
        <Text style={styles.cardLabel}>PULSO te anticipó</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardEmoji}>📅</Text>
        <Text style={styles.cardValue}>{metrics.currentStreakDays}</Text>
        <Text style={styles.cardLabel}>Días de racha</Text>
      </View>

      {insights.length > 0 && (
        <View style={styles.insightsSection}>
          <Text style={styles.insightsTitle}>PULSO te conoce</Text>
          {insights.map((text, i) => (
            <View key={i} style={styles.insightCard}>
              <Text style={styles.insightText}>{text}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, gap: 14, paddingBottom: 60 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 6 },
  card: {
    backgroundColor: '#F4F6FA',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    gap: 4,
  },
  cardEmoji: { fontSize: 22 },
  cardValue: { fontSize: 32, fontWeight: '800' },
  cardLabel: { fontSize: 14, opacity: 0.65 },
  insightsSection: { marginTop: 12, gap: 10 },
  insightsTitle: { fontSize: 17, fontWeight: '700', marginBottom: 2 },
  insightCard: { backgroundColor: '#EEF3FF', borderRadius: 14, padding: 14 },
  insightText: { fontSize: 15, lineHeight: 21 },
});
