import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { api } from '@/lib/api';
import { Brain } from '@/components/EmotionalBrain';
import { useReduceMotion } from '@/components/LungProgress';
import { IntensityScale } from '@/components/Emotional/IntensityScale';
import { getEmotionalVisualState, nivelInternoParaIntensidad, EmotionalColorKey } from '@pulso/shared';
import type { IntervencionDto, PreguntaEmocionalDto, StartSessionResponse, SubmitAnswerResponse } from '@/lib/emotional-types';

type Fase = 'pregunta' | 'acompanamiento' | 'seguridad' | 'intensidad-final' | 'resultado';

const FRASES_ACOMPANAMIENTO = [
  'Entiendo. Parece que esto te está afectando.',
  'Vamos a identificar qué está pasando.',
  'Gracias por seguir aquí. Una pregunta más y veremos qué podría ayudarte ahora.',
  'Está bien tomarte tu tiempo con esto.',
];

export default function EmotionalSessionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sessionId: string; initial?: string; emocionNombre?: string }>();
  const initial = useMemo<StartSessionResponse | null>(() => {
    try {
      return params.initial ? (JSON.parse(params.initial) as StartSessionResponse) : null;
    } catch {
      return null;
    }
  }, [params.initial]);

  const reduceMotion = useReduceMotion();
  const [fase, setFase] = useState<Fase>(initial?.pregunta ? 'pregunta' : 'intensidad-final');
  const [pregunta, setPregunta] = useState<PreguntaEmocionalDto | null>(initial?.pregunta ?? null);
  const [pendiente, setPendiente] = useState<PreguntaEmocionalDto | null>(null);
  const [respuestasCount, setRespuestasCount] = useState(0);
  const [intervencion, setIntervencion] = useState<IntervencionDto | undefined>(initial?.intervencionRecomendada);
  const [mensajeSeguridad, setMensajeSeguridad] = useState('');
  const [intensidadFinal, setIntensidadFinal] = useState(5);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<{ intensidadFinal: number } | null>(null);

  const nivelActual = nivelInternoParaIntensidad(fase === 'resultado' ? resultado?.intensidadFinal ?? 0 : intensidadFinal);
  const visual = getEmotionalVisualState(nivelActual.color as EmotionalColorKey, nivelActual.nivel);

  async function responder(preguntaId: string, respuestaId: string) {
    setEnviando(true);
    try {
      const res = await api.post<SubmitAnswerResponse>(`/emotional/sesiones/${params.sessionId}/respuestas`, {
        preguntaId,
        respuestaId,
      });

      if (res.seguridad) {
        setMensajeSeguridad(res.mensaje ?? '');
        setFase('seguridad');
        return;
      }

      const nuevoConteo = respuestasCount + 1;
      setRespuestasCount(nuevoConteo);

      if (res.pregunta) {
        if (nuevoConteo % 2 === 0) {
          setPendiente(res.pregunta);
          setFase('acompanamiento');
        } else {
          setPregunta(res.pregunta);
          setFase('pregunta');
        }
      } else {
        setIntervencion(res.intervencionRecomendada);
        setFase('intensidad-final');
      }
    } finally {
      setEnviando(false);
    }
  }

  function continuarAcompanamiento() {
    if (pendiente) {
      setPregunta(pendiente);
      setPendiente(null);
    }
    setFase('pregunta');
  }

  async function finalizar() {
    setEnviando(true);
    try {
      await api.patch(`/emotional/sesiones/${params.sessionId}/finalizar`, { intensidadFinal });
      setResultado({ intensidadFinal });
      setFase('resultado');
    } finally {
      setEnviando(false);
    }
  }

  if (fase === 'seguridad') {
    return (
      <View style={styles.center}>
        <Text style={styles.seguridadTexto}>{mensajeSeguridad}</Text>
        <Pressable
          style={styles.tsq8Button}
          onPress={() => router.replace({ pathname: '/tsq8/[sessionId]', params: { sessionId: 'new', sesionEmocionalId: params.sessionId } })}>
          <Text style={styles.tsq8ButtonText}>🆘 Abrir TSQ8</Text>
        </Pressable>
        <Pressable style={styles.backButton} onPress={() => router.replace('/(tabs)/home')}>
          <Text style={styles.backButtonText}>Volver al inicio</Text>
        </Pressable>
      </View>
    );
  }

  if (fase === 'acompanamiento') {
    const frase = FRASES_ACOMPANAMIENTO[respuestasCount % FRASES_ACOMPANAMIENTO.length];
    return (
      <View style={styles.center}>
        <Text style={styles.acompanamientoTexto}>{frase}</Text>
        <Pressable style={styles.button} onPress={continuarAcompanamiento}>
          <Text style={styles.buttonText}>Continuar</Text>
        </Pressable>
      </View>
    );
  }

  if (fase === 'pregunta' && pregunta) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.pregunta}>{pregunta.texto}</Text>
        <View style={styles.opciones}>
          {pregunta.respuestas.map((r) => (
            <Pressable
              key={r.id}
              style={styles.opcion}
              disabled={enviando}
              onPress={() => responder(pregunta.id, r.id)}>
              <Text style={styles.opcionTexto}>{r.texto}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    );
  }

  if (fase === 'intensidad-final') {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Una pregunta más antes de continuar.</Text>
        <IntensityScale value={intensidadFinal} onChange={setIntensidadFinal} label="¿Qué tan fuerte sientes esto ahora?" />
        <Pressable style={styles.button} onPress={finalizar} disabled={enviando}>
          <Text style={styles.buttonText}>{enviando ? 'Un momento...' : 'Continuar'}</Text>
        </Pressable>
      </ScrollView>
    );
  }

  // resultado
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Ya entendemos un poco mejor lo que está pasando.</Text>

      <View style={styles.brainWrap}>
        <Brain fillColor={visual.fillColor} activation={visual.activation} pulseSpeedMs={visual.pulseSpeedMs} reduceMotion={reduceMotion} />
      </View>

      <View style={styles.resumenRow}>
        <Text style={styles.resumenLabel}>Emoción</Text>
        <Text style={styles.resumenValor}>{params.emocionNombre ?? '—'}</Text>
      </View>
      <View style={styles.resumenRow}>
        <Text style={styles.resumenLabel}>Intensidad inicial</Text>
        <Text style={styles.resumenValor}>{initial?.sesion.intensidadInicial ?? '—'}/10</Text>
      </View>
      <View style={styles.resumenRow}>
        <Text style={styles.resumenLabel}>Intensidad actual</Text>
        <Text style={styles.resumenValor}>{resultado?.intensidadFinal ?? intensidadFinal}/10</Text>
      </View>
      <View style={styles.resumenRow}>
        <Text style={styles.resumenLabel}>Estado visual</Text>
        <Text style={styles.resumenValor}>{nivelActual.nombre}</Text>
      </View>

      {intervencion && (
        <View style={styles.intervencionBox}>
          <Text style={styles.intervencionTitulo}>Técnica sugerida: {intervencion.nombre}</Text>
          <Text style={styles.intervencionDescripcion}>{intervencion.descripcion}</Text>
          <Pressable
            style={styles.button}
            onPress={() =>
              router.push({
                pathname: '/emotional/tecnica/[intervencionId]',
                params: {
                  intervencionId: intervencion.id,
                  sessionId: params.sessionId,
                  intensidadAntes: String(resultado?.intensidadFinal ?? intensidadFinal),
                  nombre: intervencion.nombre,
                  descripcion: intervencion.descripcion,
                  tipo: intervencion.tipo,
                  duracionSegundos: String(intervencion.duracionSegundos ?? ''),
                },
              })
            }>
            <Text style={styles.buttonText}>Empezar técnica</Text>
          </Pressable>
        </View>
      )}

      <Text style={styles.footerTexto}>
        La intensidad bajó. Si vuelve a aumentar, puedes regresar a PULSO Emocional o utilizar TSQ8.
      </Text>

      <Pressable style={styles.backButton} onPress={() => router.replace('/(tabs)/home')}>
        <Text style={styles.backButtonText}>Volver al inicio</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 60, gap: 16, paddingBottom: 60 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 20 },
  title: { fontSize: 20, fontWeight: '800' },
  pregunta: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
  opciones: { gap: 10 },
  opcion: { backgroundColor: '#F4F6FA', borderRadius: 14, padding: 16 },
  opcionTexto: { fontSize: 15, fontWeight: '600' },
  acompanamientoTexto: { fontSize: 18, textAlign: 'center', lineHeight: 26, fontWeight: '600' },
  seguridadTexto: { fontSize: 18, textAlign: 'center', lineHeight: 26, fontWeight: '700' },
  tsq8Button: { backgroundColor: '#C24545', paddingVertical: 16, paddingHorizontal: 24, borderRadius: 14 },
  tsq8ButtonText: { color: 'white', fontSize: 16, fontWeight: '700' },
  button: { backgroundColor: '#2F5D8A', paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '700' },
  backButton: { paddingVertical: 10, alignItems: 'center' },
  backButtonText: { opacity: 0.6, fontWeight: '600' },
  brainWrap: { alignItems: 'center', marginVertical: 8 },
  resumenRow: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#EEF0F4', paddingBottom: 8 },
  resumenLabel: { fontSize: 14, opacity: 0.6 },
  resumenValor: { fontSize: 14, fontWeight: '700' },
  intervencionBox: { backgroundColor: '#EEF3FF', borderRadius: 16, padding: 16, gap: 6, marginTop: 8 },
  intervencionTitulo: { fontSize: 15, fontWeight: '800' },
  intervencionDescripcion: { fontSize: 13, opacity: 0.75, lineHeight: 19 },
  footerTexto: { fontSize: 13, opacity: 0.6, lineHeight: 19, textAlign: 'center', marginTop: 8 },
});
