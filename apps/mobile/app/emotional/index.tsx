import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { api } from '@/lib/api';
import { EmocionDto, StartSessionResponse } from '@/lib/emotional-types';
import { IntensityScale } from '@/components/Emotional/IntensityScale';

type Fase = 'seleccion' | 'intensidad';

export default function EmotionalIndexScreen() {
  const router = useRouter();
  const [emociones, setEmociones] = useState<EmocionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [fase, setFase] = useState<Fase>('seleccion');
  const [seleccionada, setSeleccionada] = useState<EmocionDto | null>(null);
  const [tipsVisibles, setTipsVisibles] = useState<string | null>(null);
  const [intensidad, setIntensidad] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .get<EmocionDto[]>('/emotional/emociones')
      .then(setEmociones)
      .finally(() => setLoading(false));
  }, []);

  function elegir(emocion: EmocionDto) {
    setSeleccionada(emocion);
    setFase('intensidad');
  }

  async function continuar() {
    if (!seleccionada) return;
    setSubmitting(true);
    try {
      const res = await api.post<StartSessionResponse>('/emotional/sesiones', {
        emocionInicialId: seleccionada.id,
        intensidadInicial: intensidad,
      });
      router.replace({
        pathname: '/emotional/session/[sessionId]',
        params: {
          sessionId: res.sesion.id,
          initial: JSON.stringify(res),
          emocionNombre: seleccionada.nombre,
        },
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (fase === 'intensidad' && seleccionada) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.emocionEmoji}>{seleccionada.icono}</Text>
        <Text style={styles.title}>{seleccionada.nombre}</Text>
        <Text style={styles.subtitle}>{seleccionada.descripcion}</Text>

        <IntensityScale value={intensidad} onChange={setIntensidad} />

        <Pressable style={styles.button} onPress={continuar} disabled={submitting}>
          <Text style={styles.buttonText}>{submitting ? 'Un momento...' : 'Continuar'}</Text>
        </Pressable>
        <Pressable style={styles.backButton} onPress={() => setFase('seleccion')}>
          <Text style={styles.backButtonText}>Elegir otra emoción</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>¿Qué se parece más a lo que estás sintiendo?</Text>

      <Pressable style={styles.evolucionLink} onPress={() => router.push('/emotional-evolution')}>
        <Text style={styles.evolucionLinkText}>Ver mi evolución emocional →</Text>
      </Pressable>

      <View style={styles.grid}>
        {emociones.map((e) => (
          <View key={e.id} style={styles.cardWrap}>
            <Pressable style={styles.card} onPress={() => elegir(e)}>
              <Text style={styles.cardEmoji}>{e.icono}</Text>
              <Text style={styles.cardLabel}>{e.nombre}</Text>
            </Pressable>
            <Pressable
              style={styles.tipButton}
              onPress={() => setTipsVisibles(tipsVisibles === e.id ? null : e.id)}>
              <Text style={styles.tipButtonText}>{tipsVisibles === e.id ? 'Ocultar técnicas' : 'Ver técnicas rápidas'}</Text>
            </Pressable>
            {tipsVisibles === e.id && (
              <View style={styles.tipsBox}>
                <Text style={styles.tipsDescripcion}>{e.descripcion}</Text>
                {e.tecnicasRapidas.map((t, i) => (
                  <Text key={i} style={styles.tipItem}>
                    •  {t}
                  </Text>
                ))}
              </View>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 60, gap: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '800' },
  subtitle: { fontSize: 14, opacity: 0.7, lineHeight: 20 },
  evolucionLink: { alignSelf: 'flex-start' },
  evolucionLinkText: { fontSize: 13, fontWeight: '700', color: '#2F5D8A' },
  emocionEmoji: { fontSize: 44, textAlign: 'center' },
  grid: { gap: 10 },
  cardWrap: { gap: 4 },
  card: {
    backgroundColor: '#F4F6FA',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardEmoji: { fontSize: 26 },
  cardLabel: { fontSize: 16, fontWeight: '700' },
  tipButton: { alignSelf: 'flex-start', paddingHorizontal: 4 },
  tipButtonText: { fontSize: 12, opacity: 0.55, fontWeight: '600' },
  tipsBox: { backgroundColor: '#EEF3FF', borderRadius: 12, padding: 12, gap: 4 },
  tipsDescripcion: { fontSize: 13, opacity: 0.8, marginBottom: 4 },
  tipItem: { fontSize: 13, lineHeight: 19 },
  button: { backgroundColor: '#2F5D8A', paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '700' },
  backButton: { paddingVertical: 10, alignItems: 'center' },
  backButtonText: { opacity: 0.6, fontWeight: '600' },
});
