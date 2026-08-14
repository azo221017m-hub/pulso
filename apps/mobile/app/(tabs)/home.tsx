import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, View } from '@/components/Themed';

export default function HubScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>¿Qué quieres trabajar hoy?</Text>

      <Pressable style={styles.card} onPress={() => router.push('/habits')}>
        <Text style={styles.cardEmoji}>🫁</Text>
        <Text style={styles.cardTitle}>PULSO Hábitos</Text>
        <Text style={styles.cardSubtitle}>Reduce y controla tus hábitos de consumo.</Text>
        <View style={styles.cardButton}>
          <Text style={styles.cardButtonText}>Trabajar en mis hábitos</Text>
        </View>
      </Pressable>

      <Pressable style={styles.card} onPress={() => router.push('/emotional')}>
        <Text style={styles.cardEmoji}>❤️</Text>
        <Text style={styles.cardTitle}>PULSO Emocional</Text>
        <Text style={styles.cardSubtitle}>Comprende lo que estás sintiendo y encuentra una forma de recuperar el equilibrio.</Text>
        <View style={styles.cardButton}>
          <Text style={styles.cardButtonText}>Trabajar con mis emociones</Text>
        </View>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 60, gap: 16 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  card: {
    backgroundColor: '#F4F6FA',
    borderRadius: 20,
    padding: 20,
    gap: 6,
  },
  cardEmoji: { fontSize: 32 },
  cardTitle: { fontSize: 18, fontWeight: '800' },
  cardSubtitle: { fontSize: 14, opacity: 0.7, lineHeight: 20, marginBottom: 8 },
  cardButton: {
    backgroundColor: '#2F5D8A',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cardButtonText: { color: 'white', fontWeight: '700', fontSize: 14 },
});
