import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Text, View } from '@/components/Themed';
import { api } from '@/lib/api';
import { Brain } from '@/components/EmotionalBrain';
import { useReduceMotion } from '@/components/LungProgress';
import {
  EMOTIONAL_BRAIN_DISCLAIMER,
  EMOTIONAL_COLOR_EXPLANATIONS,
  EMOTIONAL_COLOR_HEX,
  EmotionalColorKey,
  getEmotionalVisualState,
  NIVELES_EMOCIONALES,
} from '@pulso/shared';

interface DiaTimeline {
  fecha: string;
  conDatos: boolean;
  color: string | null;
  intensidadMaxima: number;
  intensidadPromedio: number;
  cantidadEventos: number;
  emocionPredominante: { nombre: string; icono: string } | null;
}

interface EvolucionResponse {
  rango: string;
  timeline: DiaTimeline[];
  hoy: DiaTimeline;
}

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DIAS_SEMANA_CORTO = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

function nivelDeColor(color: string | null) {
  return NIVELES_EMOCIONALES.find((n) => n.color === color) ?? NIVELES_EMOCIONALES[0];
}

export default function EmotionalEvolutionScreen() {
  const reduceMotion = useReduceMotion();
  const [data, setData] = useState<EvolucionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [diaSeleccionado, setDiaSeleccionado] = useState<number | null>(null);

  useEffect(() => {
    api
      .get<EvolucionResponse>('/emotional/evolucion?rango=semana')
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const hoy = data.hoy;
  const nivelHoy = nivelDeColor(hoy.color);
  const visualHoy = getEmotionalVisualState((hoy.color as EmotionalColorKey) ?? 'verde', nivelHoy.nivel);
  const viendoIndex = diaSeleccionado ?? data.timeline.length - 1;
  const diaViendo = data.timeline[viendoIndex];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>Hoy</Text>
        <Brain
          fillColor={visualHoy.fillColor}
          activation={visualHoy.activation}
          pulseSpeedMs={visualHoy.pulseSpeedMs}
          size={140}
          reduceMotion={reduceMotion}
        />
        <Text style={styles.heroEstado}>
          🧠 Estado predominante — {nivelHoy.nombre}
          {hoy.emocionPredominante ? ` (${hoy.emocionPredominante.icono} ${hoy.emocionPredominante.nombre})` : ''}
        </Text>
        {!hoy.conDatos && <Text style={styles.heroSinDatos}>Aún no registras ningún momento hoy.</Text>}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Esta semana</Text>
        <View style={styles.weekRow}>
          {data.timeline.map((dia, i) => {
            const fechaObj = new Date(`${dia.fecha}T00:00:00`);
            const diaSemana = fechaObj.getDay();
            const color = dia.color ? EMOTIONAL_COLOR_HEX[dia.color as EmotionalColorKey] : '#D8DEE8';
            return (
              <Pressable key={dia.fecha} style={styles.dayCol} onPress={() => setDiaSeleccionado(i)}>
                <View style={[styles.dayDot, { backgroundColor: color }, i === viendoIndex && styles.dayDotActive]} />
                <Text style={styles.dayLabel}>{DIAS_SEMANA_CORTO[diaSemana]}</Text>
              </Pressable>
            );
          })}
        </View>

        {diaViendo && (
          <View style={styles.dayDetail}>
            <Text style={styles.dayDetailTitulo}>
              {DIAS_SEMANA[new Date(`${diaViendo.fecha}T00:00:00`).getDay()]}
            </Text>
            {diaViendo.conDatos ? (
              <>
                <Text style={styles.dayDetailTexto}>
                  Emoción predominante: {diaViendo.emocionPredominante ? `${diaViendo.emocionPredominante.icono} ${diaViendo.emocionPredominante.nombre}` : '—'}
                </Text>
                <Text style={styles.dayDetailTexto}>Intensidad máxima: {diaViendo.intensidadMaxima}/10</Text>
                <Text style={styles.dayDetailTexto}>Intensidad promedio: {diaViendo.intensidadPromedio.toFixed(1)}/10</Text>
                <Text style={styles.dayDetailTexto}>Momentos registrados: {diaViendo.cantidadEventos}</Text>
              </>
            ) : (
              <Text style={styles.dayDetailTexto}>Sin datos para este día.</Text>
            )}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>¿Qué significan los colores?</Text>
        {(Object.keys(EMOTIONAL_COLOR_EXPLANATIONS) as EmotionalColorKey[]).map((key) => (
          <View key={key} style={styles.colorRow}>
            <View style={[styles.colorDot, { backgroundColor: EMOTIONAL_COLOR_HEX[key] }]} />
            <Text style={styles.colorTexto}>{EMOTIONAL_COLOR_EXPLANATIONS[key]}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.disclaimer}>{EMOTIONAL_BRAIN_DISCLAIMER}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, paddingBottom: 60, gap: 20 },
  hero: { alignItems: 'center', gap: 8, paddingVertical: 12 },
  heroLabel: { fontSize: 16, fontWeight: '700', opacity: 0.6 },
  heroEstado: { fontSize: 15, fontWeight: '700', textAlign: 'center', marginTop: 4 },
  heroSinDatos: { fontSize: 13, opacity: 0.6 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center', gap: 6 },
  dayDot: { width: 22, height: 22, borderRadius: 11 },
  dayDotActive: { borderWidth: 2, borderColor: '#2F5D8A' },
  dayLabel: { fontSize: 12, opacity: 0.6 },
  dayDetail: { backgroundColor: '#F4F6FA', borderRadius: 14, padding: 14, gap: 4, marginTop: 6 },
  dayDetailTitulo: { fontSize: 14, fontWeight: '800', marginBottom: 4 },
  dayDetailTexto: { fontSize: 13, opacity: 0.75 },
  colorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  colorDot: { width: 14, height: 14, borderRadius: 7 },
  colorTexto: { fontSize: 13, flex: 1, lineHeight: 19 },
  disclaimer: { fontSize: 11, opacity: 0.5, textAlign: 'center', lineHeight: 16, marginTop: 4 },
});
