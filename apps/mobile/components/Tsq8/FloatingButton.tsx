import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, View } from '@/components/Themed';

export function Tsq8FloatingButton() {
  const router = useRouter();
  const [expandido, setExpandido] = useState(false);

  function activarEmergencia() {
    setExpandido(false);
    router.push({ pathname: '/tsq8/[sessionId]', params: { sessionId: 'new' } });
  }

  if (expandido) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTexto}>¿Es una emergencia o necesitas que alguien te escuche?</Text>
        <Pressable style={styles.emergenciaButton} onPress={activarEmergencia}>
          <Text style={styles.emergenciaButtonText}>PRESIONA AQUÍ SI ES UNA EMERGENCIA</Text>
        </Pressable>
        <Pressable style={styles.cerrarButton} onPress={() => setExpandido(false)}>
          <Text style={styles.cerrarButtonText}>Cerrar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Pressable style={styles.fab} onPress={() => setExpandido(true)}>
      <Text style={styles.fabText}>🆘 TSQ8</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 110,
    backgroundColor: '#C24545',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  fabText: { color: 'white', fontSize: 13, fontWeight: '800' },
  card: {
    position: 'absolute',
    right: 16,
    left: 16,
    bottom: 110,
    backgroundColor: '#FDECEC',
    borderRadius: 16,
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  cardTexto: { fontSize: 14, fontWeight: '700', lineHeight: 20 },
  emergenciaButton: { backgroundColor: '#C24545', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  emergenciaButtonText: { color: 'white', fontWeight: '800', fontSize: 13, textAlign: 'center' },
  cerrarButton: { alignItems: 'center', paddingVertical: 4 },
  cerrarButtonText: { opacity: 0.6, fontWeight: '600', fontSize: 12 },
});
