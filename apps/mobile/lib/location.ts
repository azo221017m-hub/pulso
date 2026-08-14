import * as Location from 'expo-location';

/**
 * Solo se pide el permiso aquí (onboarding) — la posición en sí nunca se lee hasta que TSQ8
 * se activa explícitamente (spec §8-9). No hay tracking en segundo plano.
 */
export async function requestLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function hasLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/** Lectura puntual, solo al momento de activar TSQ8. Nunca se guarda un historial de ubicaciones. */
export async function getCurrentLocationOnce(): Promise<{ latitud: number; longitud: number } | null> {
  try {
    const granted = await hasLocationPermission();
    if (!granted) return null;
    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { latitud: position.coords.latitude, longitud: position.coords.longitude };
  } catch {
    return null;
  }
}
