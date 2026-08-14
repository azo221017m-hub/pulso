import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { api } from '@/lib/api';
import { IntensityScale } from '@/components/Emotional/IntensityScale';

type Fase = 'activo' | 'reevaluar' | 'listo';

const GROUNDING_PASOS = [
  '5 cosas que puedes ver',
  '4 cosas que puedes sentir',
  '3 cosas que puedes oír',
  '2 cosas que puedes oler',
  '1 cosa que puedes saborear',
];

const RESPIRACION_CICLO: { texto: string; segundos: number }[] = [
  { texto: 'Inhala...', segundos: 4 },
  { texto: 'Sostén...', segundos: 4 },
  { texto: 'Exhala...', segundos: 6 },
];

export default function TecnicaScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    intervencionId: string;
    sessionId: string;
    intensidadAntes: string;
    nombre: string;
    descripcion: string;
    tipo: string;
    duracionSegundos: string;
  }>();
  const duracion = params.duracionSegundos ? Number(params.duracionSegundos) : 60;

  const [fase, setFase] = useState<Fase>('activo');
  const [segundosRestantes, setSegundosRestantes] = useState(duracion);
  const [pasoGrounding, setPasoGrounding] = useState(0);
  const [cicloIndex, setCicloIndex] = useState(0);
  const [intensidadDespues, setIntensidadDespues] = useState(Number(params.intensidadAntes) || 5);
  const [enviando, setEnviando] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const esTemporizador = params.tipo === 'RESPIRACION' || params.tipo === 'PAUSA';

  useEffect(() => {
    if (!esTemporizador) return;
    intervalRef.current = setInterval(() => {
      setSegundosRestantes((s) => {
        if (s <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setFase('reevaluar');
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [esTemporizador]);

  useEffect(() => {
    if (params.tipo !== 'RESPIRACION') return;
    const ciclo = RESPIRACION_CICLO[cicloIndex];
    const timer = setTimeout(() => {
      setCicloIndex((i) => (i + 1) % RESPIRACION_CICLO.length);
    }, ciclo.segundos * 1000);
    return () => clearTimeout(timer);
  }, [cicloIndex, params.tipo]);

  async function aplicarYFinalizar(resultado?: string) {
    setEnviando(true);
    try {
      await api.post(`/emotional/sesiones/${params.sessionId}/aplicar-intervencion`, {
        intervencionId: params.intervencionId,
        intensidadAntes: Number(params.intensidadAntes) || 0,
        intensidadDespues,
        resultado,
      });
      setFase('listo');
    } finally {
      setEnviando(false);
    }
  }

  if (fase === 'listo') {
    return (
      <View style={styles.center}>
        <Text style={styles.mensaje}>Gracias por darte este momento.</Text>
        <Pressable style={styles.button} onPress={() => router.replace('/(tabs)/home')}>
          <Text style={styles.buttonText}>Volver al inicio</Text>
        </Pressable>
      </View>
    );
  }

  if (fase === 'reevaluar') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>¿Cómo te sientes ahora?</Text>
        <IntensityScale value={intensidadDespues} onChange={setIntensidadDespues} label="Intensidad después de la técnica" />
        <Pressable style={styles.button} onPress={() => aplicarYFinalizar()} disabled={enviando}>
          <Text style={styles.buttonText}>{enviando ? 'Guardando...' : 'Terminar'}</Text>
        </Pressable>
      </View>
    );
  }

  // fase 'activo'
  if (params.tipo === 'RESPIRACION') {
    return (
      <View style={styles.center}>
        <Text style={styles.tecnicaNombre}>{params.nombre}</Text>
        <Text style={styles.respiracionTexto}>{RESPIRACION_CICLO[cicloIndex].texto}</Text>
        <Text style={styles.timer}>{segundosRestantes}s</Text>
        <Pressable style={styles.skipButton} onPress={() => setFase('reevaluar')}>
          <Text style={styles.skipButtonText}>Ya estoy mejor</Text>
        </Pressable>
      </View>
    );
  }

  if (params.tipo === 'PAUSA') {
    return (
      <View style={styles.center}>
        <Text style={styles.tecnicaNombre}>{params.nombre}</Text>
        <Text style={styles.descripcion}>{params.descripcion}</Text>
        <Text style={styles.timer}>{segundosRestantes}s</Text>
        <Pressable style={styles.skipButton} onPress={() => setFase('reevaluar')}>
          <Text style={styles.skipButtonText}>Ya estoy mejor</Text>
        </Pressable>
      </View>
    );
  }

  if (params.tipo === 'GROUNDING') {
    const ultimo = pasoGrounding === GROUNDING_PASOS.length - 1;
    return (
      <View style={styles.center}>
        <Text style={styles.tecnicaNombre}>{params.nombre}</Text>
        <Text style={styles.groundingPaso}>{GROUNDING_PASOS[pasoGrounding]}</Text>
        <Pressable
          style={styles.button}
          onPress={() => (ultimo ? setFase('reevaluar') : setPasoGrounding((p) => p + 1))}>
          <Text style={styles.buttonText}>{ultimo ? 'Terminar' : 'Listo, siguiente'}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.center}>
      <Text style={styles.tecnicaNombre}>{params.nombre}</Text>
      <Text style={styles.descripcion}>{params.descripcion}</Text>
      <Pressable style={styles.button} onPress={() => setFase('reevaluar')}>
        <Text style={styles.buttonText}>Listo</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 60, gap: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 18 },
  title: { fontSize: 20, fontWeight: '800' },
  tecnicaNombre: { fontSize: 20, fontWeight: '800' },
  descripcion: { fontSize: 15, textAlign: 'center', lineHeight: 22, opacity: 0.8 },
  respiracionTexto: { fontSize: 28, fontWeight: '800' },
  groundingPaso: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  timer: { fontSize: 44, fontWeight: '800' },
  skipButton: { marginTop: 12, paddingVertical: 10, paddingHorizontal: 18 },
  skipButtonText: { opacity: 0.5, fontWeight: '600' },
  button: { backgroundColor: '#2F5D8A', paddingVertical: 16, paddingHorizontal: 24, borderRadius: 14, alignItems: 'center' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '700' },
  mensaje: { fontSize: 18, textAlign: 'center', fontWeight: '600' },
});
