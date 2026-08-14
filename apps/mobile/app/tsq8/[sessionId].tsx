import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { api } from '@/lib/api';
import { getCurrentLocationOnce } from '@/lib/location';

type Fase = 'activando' | 'listo' | 'error';

interface ActivarResponse {
  whatsappUrl: string;
  ubicacionEnviada: boolean;
}

export default function Tsq8Screen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sessionId: string; sesionEmocionalId?: string }>();
  const [fase, setFase] = useState<Fase>('activando');
  const [ubicacionEnviada, setUbicacionEnviada] = useState(false);

  async function activar() {
    setFase('activando');
    try {
      const ubicacion = await getCurrentLocationOnce();
      const res = await api.post<ActivarResponse>('/tsq8/activar', {
        latitud: ubicacion?.latitud,
        longitud: ubicacion?.longitud,
        sesionId: params.sesionEmocionalId,
      });
      setUbicacionEnviada(res.ubicacionEnviada);
      Linking.openURL(res.whatsappUrl).catch(() => {});
      setFase('listo');
    } catch {
      // Nunca se muestra el detalle técnico del error (spec §11) — solo un estado controlado.
      setFase('error');
    }
  }

  useEffect(() => {
    activar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (fase === 'activando') {
    return (
      <View style={styles.center}>
        <Text style={styles.mensaje}>Activando TSQ8...</Text>
      </View>
    );
  }

  if (fase === 'error') {
    return (
      <View style={styles.center}>
        <Text style={styles.titulo}>No pudimos completar tu solicitud</Text>
        <Text style={styles.mensaje}>Parece que no hay conexión en este momento. Intenta de nuevo.</Text>
        <Pressable style={styles.button} onPress={activar}>
          <Text style={styles.buttonText}>Reintentar</Text>
        </Pressable>
        <Pressable style={styles.backButton} onPress={() => router.replace('/(tabs)/home')}>
          <Text style={styles.backButtonText}>Cerrar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.center}>
      <Text style={styles.titulo}>TSQ8 activado</Text>
      <Text style={styles.mensaje}>Enviamos tu solicitud para que alguien pueda escucharte.</Text>
      <Text style={styles.mensaje}>
        {ubicacionEnviada ? 'También enviamos tu ubicación.' : 'No pudimos obtener tu ubicación. Tu solicitud de apoyo fue enviada.'}
      </Text>
      <Pressable style={styles.button} onPress={() => router.replace('/(tabs)/home')}>
        <Text style={styles.buttonText}>Volver al inicio</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 16 },
  titulo: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  mensaje: { fontSize: 16, textAlign: 'center', lineHeight: 23 },
  button: { backgroundColor: '#2F5D8A', paddingVertical: 16, paddingHorizontal: 24, borderRadius: 14, marginTop: 8 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '700' },
  backButton: { paddingVertical: 8 },
  backButtonText: { opacity: 0.6, fontWeight: '600' },
});
