import { NivelRiesgoRespuesta, PrismaClient, TipoIntervencionEmocional } from '@prisma/client';

// ─────────────────────────────────────────────────────────────────────────
// Catálogo de emociones (spec §3, §14) — todo el contenido de negocio en español.
// ─────────────────────────────────────────────────────────────────────────

interface EmocionSeed {
  nombre: string;
  descripcion: string;
  icono: string;
  colorBase: string;
  tecnicasRapidas: [string, string];
  orden: number;
}

const EMOCIONES: EmocionSeed[] = [
  {
    nombre: 'Tristeza',
    descripcion: 'Sientes una pesadez, ganas de llorar o de estar a solas con lo que pasó.',
    icono: '😢',
    colorBase: 'azul',
    tecnicasRapidas: ['Permítete sentirlo sin juzgarte por unos minutos.', 'Escribe una palabra que describa lo que extrañas o perdiste.'],
    orden: 1,
  },
  {
    nombre: 'Alegría',
    descripcion: 'Sientes ligereza, satisfacción o entusiasmo por algo que pasó.',
    icono: '😊',
    colorBase: 'verde',
    tecnicasRapidas: ['Disfruta el momento, no necesitas hacer nada más con él.', 'Comparte lo que sientes con alguien si tienes ganas.'],
    orden: 2,
  },
  {
    nombre: 'Enojo',
    descripcion: 'Sientes que algo fue injusto o que la situación te sobrepasó.',
    icono: '😡',
    colorBase: 'rojo',
    tecnicasRapidas: ['Respira profundo antes de responder a lo que pasó.', 'Aléjate un momento de la situación si puedes.'],
    orden: 3,
  },
  {
    nombre: 'Miedo',
    descripcion: 'Sientes que algo te amenaza o no sabes qué va a pasar.',
    icono: '😨',
    colorBase: 'morado',
    tecnicasRapidas: ['Nombra 3 cosas que puedes ver a tu alrededor ahora mismo.', 'Recuerda: puedes sentir miedo y aun así estar a salvo.'],
    orden: 4,
  },
  {
    nombre: 'Ansiedad',
    descripcion: 'Sientes inquietud, pensamientos acelerados o tensión sobre lo que viene.',
    icono: '😰',
    colorBase: 'amarillo',
    tecnicasRapidas: ['Inhala 4 segundos, sostén 4, exhala 6.', 'Escribe en una sola frase lo que te preocupa.'],
    orden: 5,
  },
  {
    nombre: 'Frustración',
    descripcion: 'Sientes que algo no avanza como esperabas, por más que lo intentas.',
    icono: '😣',
    colorBase: 'naranja',
    tecnicasRapidas: ['Haz una pausa de 60 segundos antes de continuar.', 'Pregúntate: ¿qué sí está en mis manos ahora mismo?'],
    orden: 6,
  },
  {
    nombre: 'Soledad',
    descripcion: 'Sientes que te falta compañía, comprensión o alguien con quién contar.',
    icono: '😔',
    colorBase: 'azul',
    tecnicasRapidas: ['Piensa en una persona a la que podrías escribirle hoy.', 'Recuerda que este sentimiento es temporal.'],
    orden: 7,
  },
  {
    nombre: 'Culpa',
    descripcion: 'Sientes que hiciste algo que lastimó a alguien, o a ti mismo/a.',
    icono: '😞',
    colorBase: 'morado',
    tecnicasRapidas: ['Pregúntate si hay algo concreto que puedas reparar.', 'Sé tan comprensivo/a contigo como lo serías con alguien más.'],
    orden: 8,
  },
  {
    nombre: 'Vergüenza',
    descripcion: 'Sientes que algo de ti quedó expuesto o fue juzgado por otros.',
    icono: '😳',
    colorBase: 'morado',
    tecnicasRapidas: ['Recuerda que equivocarse es parte de ser humano.', 'Nombra qué parte de esto realmente depende de ti.'],
    orden: 9,
  },
  {
    nombre: 'Decepción',
    descripcion: 'Algo o alguien no cumplió lo que esperabas.',
    icono: '😞',
    colorBase: 'azul',
    tecnicasRapidas: ['Diferencia lo que esperabas de lo que realmente pasó.', 'Permítete sentirlo antes de decidir qué hacer.'],
    orden: 10,
  },
  {
    nombre: 'Irritación',
    descripcion: 'Sientes molestia por algo que, aunque parece pequeño, se fue acumulando.',
    icono: '😤',
    colorBase: 'naranja',
    tecnicasRapidas: ['Identifica si en realidad son varias cosas pequeñas juntas.', 'Estira el cuerpo o cambia de postura un momento.'],
    orden: 11,
  },
  {
    nombre: 'Agobio',
    descripcion: 'Sientes que tienes más de lo que puedes manejar en este momento.',
    icono: '😩',
    colorBase: 'naranja',
    tecnicasRapidas: ['Elige solo una cosa para los próximos 10 minutos.', 'Escribe todo lo pendiente para sacarlo de tu cabeza.'],
    orden: 12,
  },
  {
    nombre: 'Confusión',
    descripcion: 'No tienes claro qué sientes exactamente, o qué hacer con eso.',
    icono: '😐',
    colorBase: 'morado',
    tecnicasRapidas: ['Está bien no tener claridad todavía.', 'Nombra al menos una cosa que sí sabes ahora mismo.'],
    orden: 13,
  },
  {
    nombre: 'Calma',
    descripcion: 'Sientes equilibrio, tranquilidad o que tienes el control de este momento.',
    icono: '😌',
    colorBase: 'verde',
    tecnicasRapidas: ['Aprovecha este momento para notar cómo se siente.', 'Ancla esta sensación respirando profundo un par de veces.'],
    orden: 14,
  },
];

// ─────────────────────────────────────────────────────────────────────────
// Niveles emocionales internos de PULSO (spec §20) — no son un diagnóstico.
// ─────────────────────────────────────────────────────────────────────────

const NIVELES = [
  { nombre: 'Estable', nivel: 1, intensidadMinima: 0, intensidadMaxima: 3, color: 'verde', descripcion: 'Tu estado emocional parece relativamente equilibrado. Objetivo: conservar el equilibrio.' },
  { nombre: 'Atención', nivel: 2, intensidadMinima: 4, intensidadMaxima: 6, color: 'amarillo', descripcion: 'Hay una emoción que merece un poco de atención. Objetivo: intervenir antes de que aumente.' },
  { nombre: 'Alta intensidad', nivel: 3, intensidadMinima: 7, intensidadMaxima: 8, color: 'naranja', descripcion: 'La activación emocional es alta. Objetivo: reducirla y evitar decisiones impulsivas.' },
  { nombre: 'Crítico', nivel: 4, intensidadMinima: 9, intensidadMaxima: 10, color: 'rojo', descripcion: 'Objetivo: priorizar tu seguridad, apoyo y TSQ8 si hace falta.' },
];

// ─────────────────────────────────────────────────────────────────────────
// Catálogo de técnicas / intervenciones (spec §23).
// ─────────────────────────────────────────────────────────────────────────

const INTERVENCIONES: {
  nombre: string;
  descripcion: string;
  tipo: TipoIntervencionEmocional;
  duracionSegundos: number | null;
  nivelMinimo: number;
  nivelMaximo: number;
}[] = [
  { nombre: 'Respiración', descripcion: 'Ejercicio de respiración guiada (4 segundos inhalar, 4 sostener, 6 exhalar) para bajar la activación.', tipo: 'RESPIRACION', duracionSegundos: 60, nivelMinimo: 1, nivelMaximo: 4 },
  { nombre: 'Pausa', descripcion: 'Un temporizador breve para detenerte antes de reaccionar o decidir algo.', tipo: 'PAUSA', duracionSegundos: 90, nivelMinimo: 2, nivelMaximo: 4 },
  { nombre: 'Grounding', descripcion: 'Identifica 5 cosas que ves, 4 que sientes, 3 que oyes, 2 que hueles y 1 que saboreas.', tipo: 'GROUNDING', duracionSegundos: 120, nivelMinimo: 2, nivelMaximo: 4 },
  { nombre: 'Movimiento', descripcion: 'Camina o cambia de espacio por unos minutos.', tipo: 'MOVIMIENTO', duracionSegundos: null, nivelMinimo: 1, nivelMaximo: 3 },
  { nombre: 'Distanciamiento', descripcion: 'Aléjate temporalmente de lo que detonó la emoción.', tipo: 'DISTANCIAMIENTO', duracionSegundos: null, nivelMinimo: 2, nivelMaximo: 4 },
  { nombre: 'Distracción saludable', descripcion: 'Haz una actividad breve que te ayude a cambiar el foco por un momento.', tipo: 'DISTRACCION', duracionSegundos: null, nivelMinimo: 1, nivelMaximo: 2 },
  { nombre: 'Comunicación', descripcion: 'Prepara lo que quieres decir después de que baje la intensidad, no antes.', tipo: 'COMUNICACION', duracionSegundos: null, nivelMinimo: 1, nivelMaximo: 3 },
  { nombre: 'Contacto', descripcion: 'Busca a una persona de confianza para hablar de lo que está pasando.', tipo: 'CONTACTO', duracionSegundos: null, nivelMinimo: 3, nivelMaximo: 4 },
];

// ─────────────────────────────────────────────────────────────────────────
// Árboles de decisión (spec §15-18) — 100% administrable desde datos, nunca
// hardcodeado en el frontend. Cada nodo se referencia por una clave local
// (`key`) que solo existe durante el seed, para poder resolver los enlaces
// `siguientePreguntaId` entre preguntas antes de insertarlas.
// ─────────────────────────────────────────────────────────────────────────

interface RespuestaNodo {
  texto: string;
  orden: number;
  nextKey?: string;
  nivelRiesgo?: NivelRiesgoRespuesta;
  accion?: string;
}

interface PreguntaNodo {
  key: string;
  nivel: number;
  texto: string;
  respuestas: RespuestaNodo[];
}

/** Pregunta final compartida por la mayoría de las ramas: detecta conducta y señales de riesgo. */
function conductaComun(nivel: number): PreguntaNodo {
  return {
    key: 'conducta',
    nivel,
    texto: '¿Qué sueles hacer cuando esto pasa?',
    respuestas: [
      { texto: 'Intento resolverlo o hablarlo', orden: 1 },
      { texto: 'Me quedo callado/a', orden: 2, accion: 'aislarse' },
      { texto: 'Me pongo a la defensiva', orden: 3, accion: 'ponerse a la defensiva' },
      { texto: 'Me alejo de la situación', orden: 4, accion: 'aislarse' },
      { texto: 'Como o consumo algo para sentirme mejor', orden: 5, accion: 'consumir compulsivamente' },
      { texto: 'No estoy seguro/a', orden: 6 },
      { texto: 'Quiero hacerme daño', orden: 7, nivelRiesgo: 'CRITICO', accion: 'pensar en autolesionarse' },
      { texto: 'Quiero lastimar a alguien', orden: 8, nivelRiesgo: 'CRITICO', accion: 'agredir a otra persona' },
    ],
  };
}

/** Árbol genérico de 2 niveles para emociones sin un árbol detallado propio en el spec. */
function arbolGenerico(opciones: string[]): PreguntaNodo[] {
  return [
    {
      key: 'n1',
      nivel: 1,
      texto: '¿Qué se parece más a lo que estás sintiendo?',
      respuestas: [
        ...opciones.map((texto, i) => ({ texto, orden: i + 1, nextKey: 'conducta' })),
        { texto: 'No estoy seguro/a', orden: opciones.length + 1, nextKey: 'conducta' },
      ],
    },
    conductaComun(2),
  ];
}

const ARBOL_TRISTEZA: PreguntaNodo[] = [
  {
    key: 'n1',
    nivel: 1,
    texto: '¿Se parece más a...?',
    respuestas: [
      { texto: 'Soledad', orden: 1, nextKey: 'conducta' },
      { texto: 'Pérdida', orden: 2, nextKey: 'conducta' },
      { texto: 'Decepción', orden: 3, nextKey: 'decepcion' },
      { texto: 'Cansancio emocional', orden: 4, nextKey: 'conducta' },
      { texto: 'Rechazo', orden: 5, nextKey: 'conducta' },
      { texto: 'No sé', orden: 6, nextKey: 'conducta' },
    ],
  },
  {
    key: 'decepcion',
    nivel: 2,
    texto: '¿La decepción fue principalmente porque...?',
    respuestas: [
      { texto: 'Alguien hizo algo que no esperaba', orden: 1, nextKey: 'conducta' },
      { texto: 'Algo que quería no ocurrió', orden: 2, nextKey: 'conducta' },
      { texto: 'Esperaba que alguien me apoyara', orden: 3, nextKey: 'conducta' },
      { texto: 'Sentí que no me escucharon', orden: 4, nextKey: 'no_escuchado' },
      { texto: 'Sentí que me juzgaron', orden: 5, nextKey: 'conducta' },
      { texto: 'Me decepcioné de mí mismo', orden: 6, nextKey: 'conducta' },
    ],
  },
  {
    key: 'no_escuchado',
    nivel: 3,
    texto: 'Cuando sientes que no te escuchan, ¿qué suele pasar contigo?',
    respuestas: [
      { texto: 'Intento explicar nuevamente', orden: 1 },
      { texto: 'Me quedo callado', orden: 2, accion: 'aislarse' },
      { texto: 'Me pongo a la defensiva', orden: 3, accion: 'ponerse a la defensiva' },
      { texto: 'Me enojo', orden: 4 },
      { texto: 'Me alejo', orden: 5, accion: 'aislarse' },
      { texto: 'Quiero responder inmediatamente', orden: 6, accion: 'responder impulsivamente' },
      { texto: 'Siento ganas de hacerme daño', orden: 7, nivelRiesgo: 'CRITICO', accion: 'pensar en autolesionarse' },
      { texto: 'No estoy seguro', orden: 8 },
    ],
  },
  conductaComun(2),
];

const ARBOL_ENOJO: PreguntaNodo[] = [
  {
    key: 'n1',
    nivel: 1,
    texto: '¿Tu enojo se parece más a...?',
    respuestas: [
      { texto: 'Alguien hizo algo que consideré injusto', orden: 1, nextKey: 'escalamiento' },
      { texto: 'No me escucharon', orden: 2, nextKey: 'escalamiento' },
      { texto: 'Me juzgaron', orden: 3, nextKey: 'escalamiento' },
      { texto: 'Me contradijeron', orden: 4, nextKey: 'escalamiento' },
      { texto: 'Me faltaron al respeto', orden: 5, nextKey: 'escalamiento' },
      { texto: 'Algo salió mal', orden: 6, nextKey: 'escalamiento' },
      { texto: 'Estoy frustrado conmigo mismo', orden: 7, nextKey: 'escalamiento' },
      { texto: 'No sé exactamente por qué', orden: 8, nextKey: 'escalamiento' },
    ],
  },
  {
    key: 'escalamiento',
    nivel: 2,
    texto: '¿Qué notas primero cuando aumenta tu enojo?',
    respuestas: [
      { texto: 'Hablo más fuerte', orden: 1 },
      { texto: 'Quiero discutir', orden: 2 },
      { texto: 'Me pongo a la defensiva', orden: 3, accion: 'ponerse a la defensiva' },
      { texto: 'Me alejo', orden: 4, accion: 'aislarse' },
      { texto: 'Respondo impulsivamente', orden: 5, accion: 'responder impulsivamente' },
      { texto: 'Siento tensión física', orden: 6 },
      { texto: 'Quiero romper algo', orden: 7, nivelRiesgo: 'ALTO', accion: 'romper objetos' },
      { texto: 'Quiero lastimarme', orden: 8, nivelRiesgo: 'CRITICO', accion: 'pensar en autolesionarse' },
      { texto: 'Quiero lastimar a alguien', orden: 9, nivelRiesgo: 'CRITICO', accion: 'agredir a otra persona' },
    ],
  },
];

const ARBOL_ANSIEDAD: PreguntaNodo[] = [
  {
    key: 'n1',
    nivel: 1,
    texto: '¿Qué se parece más a lo que ocurre?',
    respuestas: [
      { texto: 'Estoy pensando demasiado', orden: 1, nextKey: 'cuerpo' },
      { texto: 'Estoy esperando que ocurra algo malo', orden: 2, nextKey: 'cuerpo' },
      { texto: 'Siento que no puedo controlar la situación', orden: 3, nextKey: 'cuerpo' },
      { texto: 'Tengo demasiadas cosas pendientes', orden: 4, nextKey: 'cuerpo' },
      { texto: 'Estoy preocupado por alguien', orden: 5, nextKey: 'cuerpo' },
      { texto: 'No sé por qué estoy así', orden: 6, nextKey: 'cuerpo' },
    ],
  },
  {
    key: 'cuerpo',
    nivel: 2,
    texto: '¿Qué notas en tu cuerpo?',
    respuestas: [
      { texto: 'Corazón acelerado', orden: 1 },
      { texto: 'Respiración rápida', orden: 2 },
      { texto: 'Tensión', orden: 3 },
      { texto: 'Inquietud', orden: 4 },
      { texto: 'Necesidad de moverme', orden: 5 },
      { texto: 'Dificultad para concentrarme', orden: 6 },
      { texto: 'Ninguna de las anteriores', orden: 7 },
    ],
  },
];

const ARBOLES: Record<string, PreguntaNodo[]> = {
  Tristeza: ARBOL_TRISTEZA,
  Enojo: ARBOL_ENOJO,
  Ansiedad: ARBOL_ANSIEDAD,
  Miedo: arbolGenerico(['Algo se siente como una amenaza real', 'No sé qué va a pasar y eso me inquieta', 'Temo perder algo o a alguien importante', 'Recordé algo que me asustó antes']),
  Frustración: arbolGenerico(['Algo no salió como esperaba', 'Lo intenté varias veces y no funciona', 'Alguien no cumplió lo que dijo', 'Siento que pierdo el tiempo']),
  Soledad: arbolGenerico(['Siento que nadie me entiende', 'Extraño a alguien', 'Paso mucho tiempo sin hablar con nadie', 'Siento que no tengo con quién contar']),
  Culpa: arbolGenerico(['Siento que lastimé a alguien', 'No hice algo que debía hacer', 'Le fallé a alguien importante', 'Me estoy juzgando por algo que hice']),
  Vergüenza: arbolGenerico(['Alguien vio algo que quería ocultar', 'Sentí que me juzgaron frente a otros', 'Cometí un error frente a alguien', 'Siento que no cumplí una expectativa']),
  Decepción: arbolGenerico(['Alguien no cumplió lo que esperaba', 'Algo que quería no ocurrió', 'Me decepcioné de mí mismo/a', 'Esperaba más apoyo de alguien']),
  Irritación: arbolGenerico(['Muchas cosas pequeñas se acumularon', 'Algo interrumpió lo que estaba haciendo', 'Estoy cansado/a y todo me molesta más', 'Alguien no hizo lo que le pedí']),
  Agobio: arbolGenerico(['Tengo demasiadas cosas pendientes', 'Siento que no alcanzo el tiempo', 'Varias personas me piden cosas a la vez', 'No sé por dónde empezar']),
  Confusión: arbolGenerico(['No sé qué estoy sintiendo realmente', 'Recibí información contradictoria', 'No sé qué decisión tomar', 'Varias emociones se mezclan a la vez']),
  Calma: arbolGenerico(['Terminé algo que me importaba', 'Pasé tiempo con alguien importante para mí', 'Descansé lo suficiente', 'Resolví algo que me preocupaba']),
  Alegría: arbolGenerico(['Logré algo importante para mí', 'Algo bueno pasó sin esperarlo', 'Compartí un momento especial con alguien', 'Me siento orgulloso/a de mí mismo/a']),
};

export async function seedEmotional(prisma: PrismaClient) {
  console.log('Seeding PULSO Emocional...');

  const emocionByNombre = new Map<string, { id: string }>();
  for (const e of EMOCIONES) {
    const row = await prisma.emocion.upsert({
      where: { nombre: e.nombre },
      create: e,
      update: e,
    });
    emocionByNombre.set(e.nombre, row);
  }

  for (const n of NIVELES) {
    await prisma.nivelEmocional.upsert({
      where: { nivel: n.nivel },
      create: n,
      update: n,
    });
  }

  for (const i of INTERVENCIONES) {
    await prisma.intervencion.upsert({
      where: { nombre: i.nombre },
      create: i,
      update: i,
    });
  }

  for (const [emocionNombre, nodos] of Object.entries(ARBOLES)) {
    const emocion = emocionByNombre.get(emocionNombre);
    if (!emocion) throw new Error(`Emoción no encontrada en el catálogo: ${emocionNombre}`);

    // Paso 1: crear/actualizar todas las preguntas del árbol, guardando su id real por key.
    const preguntaIdByKey = new Map<string, string>();
    for (const nodo of nodos) {
      const pregunta = await prisma.preguntaEmocional.upsert({
        where: { emocionId_nivel_orden: { emocionId: emocion.id, nivel: nodo.nivel, orden: 1 } },
        create: { emocionId: emocion.id, nivel: nodo.nivel, orden: 1, texto: nodo.texto },
        update: { texto: nodo.texto },
      });
      preguntaIdByKey.set(nodo.key, pregunta.id);
    }

    // Paso 2: crear/actualizar las respuestas, resolviendo siguientePreguntaId contra el mapa.
    for (const nodo of nodos) {
      const preguntaId = preguntaIdByKey.get(nodo.key)!;
      for (const r of nodo.respuestas) {
        const siguientePreguntaId = r.nextKey ? preguntaIdByKey.get(r.nextKey) : undefined;
        await prisma.respuestaEmocional.upsert({
          where: { preguntaId_orden: { preguntaId, orden: r.orden } },
          create: {
            preguntaId,
            texto: r.texto,
            orden: r.orden,
            siguientePreguntaId,
            nivelRiesgo: r.nivelRiesgo ?? 'NINGUNO',
            accion: r.accion,
          },
          update: {
            texto: r.texto,
            siguientePreguntaId,
            nivelRiesgo: r.nivelRiesgo ?? 'NINGUNO',
            accion: r.accion,
          },
        });
      }
    }
  }

  console.log(`Listo: ${EMOCIONES.length} emociones, ${NIVELES.length} niveles, ${INTERVENCIONES.length} intervenciones, ${Object.keys(ARBOLES).length} árboles.`);
}
