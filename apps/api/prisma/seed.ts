import { PrismaClient, MessageCategory, Tone } from '@prisma/client';

const prisma = new PrismaClient();

interface TemplateSeed {
  category: MessageCategory;
  tone: Tone;
  minAlertLevel: number;
  maxAlertLevel: number;
  text: string;
  supportsMotivationPlaceholder?: boolean;
  supportsStatPlaceholder?: boolean;
}

/**
 * The message bank. Every entry was written/reviewed against spec §9's banned patterns: no
 * guilt ("estás decepcionando a tu familia"), no threats, no "fallaste", no comparisons to
 * lost time/health, no ultimatums. The goal is accompaniment + reflection + autonomy + hope —
 * never fear. A handful of lines are the user's own verbatim tone examples from the spec.
 */
const templates: TemplateSeed[] = [
  // ── encouragement (alert level 1) ─────────────────────────────────────
  { category: 'encouragement', tone: 'WARM', minAlertLevel: 1, maxAlertLevel: 1, text: 'Estás haciendo algo difícil, y lo estás haciendo de todas formas. Eso cuenta.' },
  { category: 'encouragement', tone: 'WARM', minAlertLevel: 1, maxAlertLevel: 1, text: 'Cada momento que atraviesas suma, aunque no lo sientas en el momento.' },
  { category: 'encouragement', tone: 'CALM', minAlertLevel: 1, maxAlertLevel: 1, text: 'No hace falta que sea perfecto. Solo tiene que ser hoy.' },
  { category: 'encouragement', tone: 'WARM', minAlertLevel: 1, maxAlertLevel: 1, text: 'Estás aquí, intentándolo. Eso ya es un movimiento en la dirección correcta.' },
  { category: 'encouragement', tone: 'CALM', minAlertLevel: 1, maxAlertLevel: 1, text: 'Ir despacio también es avanzar.' },
  { category: 'encouragement', tone: 'WARM', minAlertLevel: 1, maxAlertLevel: 1, text: 'No tienes que sentirte fuerte para estar haciendo algo fuerte.' },
  { category: 'encouragement', tone: 'CALM', minAlertLevel: 1, maxAlertLevel: 1, text: 'Un momento a la vez. Así se construye esto.' },
  { category: 'encouragement', tone: 'WARM', minAlertLevel: 1, maxAlertLevel: 1, text: 'Lo que estás haciendo no es fácil, y aun así lo sigues intentando.' },
  { category: 'encouragement', tone: 'WARM', minAlertLevel: 1, maxAlertLevel: 1, text: 'Lo que sea que necesites hoy, PULSO va a intentar ayudarte a encontrarlo.' },
  { category: 'encouragement', tone: 'WARM', minAlertLevel: 1, maxAlertLevel: 1, text: 'Lo estás haciendo mejor de lo que crees.' },

  // ── empathy (alert level 1) ────────────────────────────────────────────
  { category: 'empathy', tone: 'WARM', minAlertLevel: 1, maxAlertLevel: 1, text: 'Si hoy está siendo difícil, eso no significa que estés retrocediendo. Significa que estás enfrentando algo difícil.' },
  { category: 'empathy', tone: 'WARM', minAlertLevel: 1, maxAlertLevel: 1, text: 'Hay una parte de ti que está cansada de empezar de nuevo. Hoy puedes hacer algo diferente.' },
  { category: 'empathy', tone: 'CALM', minAlertLevel: 1, maxAlertLevel: 1, text: 'Está bien si esto se siente pesado ahora mismo.' },
  { category: 'empathy', tone: 'WARM', minAlertLevel: 1, maxAlertLevel: 1, text: 'No tienes que explicar por qué es difícil. Solo tiene que serlo, y eso ya es suficiente razón para hacer una pausa.' },
  { category: 'empathy', tone: 'CALM', minAlertLevel: 1, maxAlertLevel: 1, text: 'Dejar un hábito no es una línea recta. A veces se siente como ir para atrás, aunque no lo sea.' },
  { category: 'empathy', tone: 'WARM', minAlertLevel: 1, maxAlertLevel: 1, text: 'Lo que sientes ahora tiene sentido. No estás exagerando.' },
  { category: 'empathy', tone: 'WARM', minAlertLevel: 1, maxAlertLevel: 1, text: 'No estás solo en esto, aunque se sienta así en este momento.' },
  { category: 'empathy', tone: 'CALM', minAlertLevel: 1, maxAlertLevel: 1, text: 'Cuesta. Y aun así estás aquí.' },
  { category: 'empathy', tone: 'CALM', minAlertLevel: 1, maxAlertLevel: 1, text: 'A veces el cuerpo pide algo que la mente ya no quiere. Eso también es parte del proceso.' },
  { category: 'empathy', tone: 'WARM', minAlertLevel: 1, maxAlertLevel: 1, text: 'No necesitas justificar por qué este momento pesa. Solo necesitas atravesarlo.' },

  // ── reflection (alert level 1) ─────────────────────────────────────────
  { category: 'reflection', tone: 'CALM', minAlertLevel: 1, maxAlertLevel: 1, text: 'No tienes que ganar todo el día. Solo necesitas cuidar este momento.' },
  { category: 'reflection', tone: 'WARM', minAlertLevel: 1, maxAlertLevel: 1, text: 'Recuerda por qué empezaste. No para castigarte, sino para recordar qué quieres recuperar.' },
  { category: 'reflection', tone: 'CALM', minAlertLevel: 1, maxAlertLevel: 1, text: 'Parece que este momento suele ser difícil para ti.' },
  { category: 'reflection', tone: 'CALM', minAlertLevel: 1, maxAlertLevel: 1, text: '¿Qué necesitarías en este momento, además de un cigarro?' },
  { category: 'reflection', tone: 'CALM', minAlertLevel: 1, maxAlertLevel: 1, text: 'Esto que sientes ahora va a cambiar, tenga la forma que tenga.' },
  { category: 'reflection', tone: 'CALM', minAlertLevel: 1, maxAlertLevel: 1, text: 'A veces la pregunta no es "¿puedo dejar de fumar para siempre?", sino "¿qué elijo en los próximos minutos?".' },
  { category: 'reflection', tone: 'CALM', minAlertLevel: 1, maxAlertLevel: 1, text: 'No todos los momentos difíciles necesitan una respuesta inmediata.' },
  { category: 'reflection', tone: 'CALM', minAlertLevel: 1, maxAlertLevel: 1, text: '¿Este impulso es realmente sobre el cigarro, o sobre otra cosa?' },
  { category: 'reflection', tone: 'WARM', minAlertLevel: 1, maxAlertLevel: 1, text: 'Un momento de duda no borra el camino que ya recorriste.' },
  { category: 'reflection', tone: 'CALM', minAlertLevel: 1, maxAlertLevel: 1, text: 'Puedes observar este momento sin tener que actuar todavía.' },

  // ── anticipation (alert level 2) ───────────────────────────────────────
  { category: 'anticipation', tone: 'CALM', minAlertLevel: 2, maxAlertLevel: 2, text: 'Tu patrón indica que podrías estar entrando en uno de tus momentos de mayor riesgo.' },
  { category: 'anticipation', tone: 'CALM', minAlertLevel: 2, maxAlertLevel: 2, text: 'Quizá este sea un buen momento para hacer una pausa.' },
  { category: 'anticipation', tone: 'WARM', minAlertLevel: 2, maxAlertLevel: 2, text: 'Ese impulso va a pasar. Tú no tienes que irte con él.' },
  { category: 'anticipation', tone: 'CALM', minAlertLevel: 2, maxAlertLevel: 2, text: 'Tu patrón dice que este horario suele ser complicado. No es una sorpresa que hoy vuelva a aparecer.' },
  { category: 'anticipation', tone: 'CALM', minAlertLevel: 2, maxAlertLevel: 2, text: 'Esto que estás por sentir no dura para siempre, aunque ahora parezca que sí.' },
  { category: 'anticipation', tone: 'CALM', minAlertLevel: 2, maxAlertLevel: 2, text: 'Si el impulso aparece en los próximos minutos, ya sabes que es solo eso: un impulso.' },
  { category: 'anticipation', tone: 'CALM', minAlertLevel: 2, maxAlertLevel: 2, text: 'Estás entrando en un momento que sueles reconocer. Puedes decidir cómo recibirlo.' },
  { category: 'anticipation', tone: 'CALM', minAlertLevel: 2, maxAlertLevel: 2, text: 'No hace falta anticiparte con miedo. Solo con un poco de atención.' },
  { category: 'anticipation', tone: 'CALM', minAlertLevel: 2, maxAlertLevel: 2, text: 'Este momento se acerca. No tienes que resolverlo todavía, solo notarlo.' },
  { category: 'anticipation', tone: 'WARM', minAlertLevel: 2, maxAlertLevel: 2, text: 'A veces basta con saber que algo puede venir, para que pese un poco menos cuando llega.' },

  // ── achievement (milestone-triggered, not alert-triggered) ─────────────
  { category: 'achievement', tone: 'WARM', minAlertLevel: 0, maxAlertLevel: 0, text: 'Hoy ya atravesaste {{stat}} momentos difíciles. Quizá este sea el siguiente.', supportsStatPlaceholder: true },
  { category: 'achievement', tone: 'WARM', minAlertLevel: 0, maxAlertLevel: 0, text: 'Cada momento que superaste sigue contando, incluso los que ya no recuerdas.' },
  { category: 'achievement', tone: 'WARM', minAlertLevel: 0, maxAlertLevel: 0, text: 'Llevas más resistidos de los que probablemente puedas nombrar ahora mismo.' },
  { category: 'achievement', tone: 'WARM', minAlertLevel: 0, maxAlertLevel: 0, text: 'Lo que ya lograste no desaparece, pase lo que pase con este momento.' },
  { category: 'achievement', tone: 'WARM', minAlertLevel: 0, maxAlertLevel: 0, text: 'Hay una versión de ti de hace unas semanas que estaría orgullosa de este momento.' },
  { category: 'achievement', tone: 'CALM', minAlertLevel: 0, maxAlertLevel: 0, text: 'Esto que estás construyendo no se mide en un solo día.' },
  { category: 'achievement', tone: 'WARM', minAlertLevel: 0, maxAlertLevel: 0, text: 'Ya demostraste, más de una vez, que puedes atravesar esto.' },
  { category: 'achievement', tone: 'CALM', minAlertLevel: 0, maxAlertLevel: 0, text: 'No hace falta un cierre perfecto para que lo de hoy cuente.' },
  { category: 'achievement', tone: 'WARM', minAlertLevel: 0, maxAlertLevel: 0, text: 'Estás más lejos de donde empezaste de lo que a veces sientes.' },
  { category: 'achievement', tone: 'WARM', minAlertLevel: 0, maxAlertLevel: 0, text: 'Cada vez que elegiste distinto, quedó algo. Eso no se pierde.' },

  // ── resilience (alert levels 2-3) ──────────────────────────────────────
  { category: 'resilience', tone: 'WARM', minAlertLevel: 2, maxAlertLevel: 3, text: 'No estás peleando contra un cigarro. Estás construyendo una versión de ti que ya no lo necesita.' },
  { category: 'resilience', tone: 'CALM', minAlertLevel: 2, maxAlertLevel: 3, text: 'La última vez que apareció este impulso, elegiste otra cosa. Puedes volver a hacerlo.' },
  { category: 'resilience', tone: 'CALM', minAlertLevel: 2, maxAlertLevel: 3, text: 'Esto es difícil, y también es temporal.' },
  { category: 'resilience', tone: 'WARM', minAlertLevel: 2, maxAlertLevel: 3, text: 'Ya atravesaste momentos parecidos a este antes.' },
  { category: 'resilience', tone: 'CALM', minAlertLevel: 2, maxAlertLevel: 3, text: 'No necesitas sentirte fuerte para actuar con fuerza.' },
  { category: 'resilience', tone: 'CALM', minAlertLevel: 2, maxAlertLevel: 3, text: 'Lo que se siente imposible ahora mismo, va a pesar distinto en unos minutos.' },
  { category: 'resilience', tone: 'WARM', minAlertLevel: 2, maxAlertLevel: 3, text: 'Puedes tambalear en este momento sin que eso signifique caer.' },
  { category: 'resilience', tone: 'CALM', minAlertLevel: 2, maxAlertLevel: 3, text: 'Aguantar este momento no te cuesta nada que no puedas recuperar.' },
  { category: 'resilience', tone: 'WARM', minAlertLevel: 2, maxAlertLevel: 3, text: '{{stat}} veces ya elegiste distinto. Esta puede ser una más.', supportsStatPlaceholder: true },
  { category: 'resilience', tone: 'WARM', minAlertLevel: 2, maxAlertLevel: 3, text: 'Nada de lo que sientas ahora define lo que vas a hacer después.' },

  // ── identity (milestone-triggered, not alert-triggered) ────────────────
  { category: 'identity', tone: 'WARM', minAlertLevel: 0, maxAlertLevel: 0, text: 'No tienes que demostrar que puedes dejar de fumar para siempre. Demuéstrate que puedes elegir qué hacer con este momento.' },
  { category: 'identity', tone: 'WARM', minAlertLevel: 0, maxAlertLevel: 0, text: 'Estás dejando de ser la persona que apaga esto con un cigarro.' },
  { category: 'identity', tone: 'WARM', minAlertLevel: 0, maxAlertLevel: 0, text: 'Hay una versión tuya que ya no necesita esto. La estás construyendo ahora mismo.' },
  { category: 'identity', tone: 'CALM', minAlertLevel: 0, maxAlertLevel: 0, text: 'Esto no es solo dejar un hábito. Es decidir quién quieres ser en los momentos difíciles.' },
  { category: 'identity', tone: 'WARM', minAlertLevel: 0, maxAlertLevel: 0, text: '{{motivation}}. Eso también es parte de quién estás siendo hoy.', supportsMotivationPlaceholder: true },
  { category: 'identity', tone: 'WARM', minAlertLevel: 0, maxAlertLevel: 0, text: 'No eres tus recaídas. Eres lo que sigues intentando después de ellas.' },
  { category: 'identity', tone: 'WARM', minAlertLevel: 0, maxAlertLevel: 0, text: 'Cada elección distinta te acerca un poco más a la persona que quieres ser.' },
  { category: 'identity', tone: 'CALM', minAlertLevel: 0, maxAlertLevel: 0, text: 'No se trata de ser alguien perfecto. Se trata de ser alguien que ya no necesita esto.' },
  { category: 'identity', tone: 'CALM', minAlertLevel: 0, maxAlertLevel: 0, text: 'Quien eres no se decide en un solo cigarro, ni en un solo momento resistido.' },
  { category: 'identity', tone: 'WARM', minAlertLevel: 0, maxAlertLevel: 0, text: 'Estás soltando algo que durante mucho tiempo pensaste que era parte de ti.' },

  // ── self_control (alert levels 2-3) ─────────────────────────────────────
  { category: 'self_control', tone: 'DIRECT', minAlertLevel: 2, maxAlertLevel: 3, text: 'No se trata de que nunca vuelvas a sentir ganas. Se trata de que las ganas ya no decidan por ti.' },
  { category: 'self_control', tone: 'CALM', minAlertLevel: 2, maxAlertLevel: 3, text: 'No tienes que resolver nada ahora. Solo tienes que esperar un poco.' },
  { category: 'self_control', tone: 'CALM', minAlertLevel: 2, maxAlertLevel: 3, text: 'Puedes sentir el impulso sin obedecerlo.' },
  { category: 'self_control', tone: 'CALM', minAlertLevel: 2, maxAlertLevel: 3, text: 'Elegir distinto no requiere sentirte distinto todavía.' },
  { category: 'self_control', tone: 'DIRECT', minAlertLevel: 2, maxAlertLevel: 3, text: 'El impulso no decide. Tú decides qué hacer con él.' },
  { category: 'self_control', tone: 'CALM', minAlertLevel: 2, maxAlertLevel: 3, text: 'No necesitas apagar la sensación. Solo necesitas no actuar todavía.' },
  { category: 'self_control', tone: 'CALM', minAlertLevel: 2, maxAlertLevel: 3, text: 'Puedes dejar pasar este minuto sin decidir nada sobre los que siguen.' },
  { category: 'self_control', tone: 'CALM', minAlertLevel: 2, maxAlertLevel: 3, text: 'Esto que sientes es real, y aun así no tiene que mandar.' },
  { category: 'self_control', tone: 'DIRECT', minAlertLevel: 2, maxAlertLevel: 3, text: 'No tienes que ganarle a las ganas. Solo tienes que no seguirlas por ahora.' },
  { category: 'self_control', tone: 'CALM', minAlertLevel: 2, maxAlertLevel: 3, text: 'Elegir esperar también es una forma de elegir.' },

  // ── hope (milestone-triggered, not alert-triggered) ─────────────────────
  { category: 'hope', tone: 'WARM', minAlertLevel: 0, maxAlertLevel: 0, text: 'Quizá este sea uno de esos momentos que mañana recuerdes con orgullo.' },
  { category: 'hope', tone: 'WARM', minAlertLevel: 0, maxAlertLevel: 0, text: 'Lo que hoy pesa tanto, va a pesar distinto más adelante.' },
  { category: 'hope', tone: 'WARM', minAlertLevel: 0, maxAlertLevel: 0, text: 'Hay una versión de esto que todavía no conoces, y va mejorando con cada intento.' },
  { category: 'hope', tone: 'CALM', minAlertLevel: 0, maxAlertLevel: 0, text: 'No siempre se va a sentir así de difícil.' },
  { category: 'hope', tone: 'WARM', minAlertLevel: 0, maxAlertLevel: 0, text: 'Las cosas que hoy cuestan tanto, con el tiempo cuestan menos.' },
  { category: 'hope', tone: 'WARM', minAlertLevel: 0, maxAlertLevel: 0, text: 'Vas construyendo algo que todavía no puedes ver del todo.' },
  { category: 'hope', tone: 'WARM', minAlertLevel: 0, maxAlertLevel: 0, text: '{{motivation}}. Eso sigue siendo posible, un momento a la vez.', supportsMotivationPlaceholder: true },
  { category: 'hope', tone: 'WARM', minAlertLevel: 0, maxAlertLevel: 0, text: 'El hecho de que sigas intentándolo ya dice algo sobre hacia dónde vas.' },
  { category: 'hope', tone: 'WARM', minAlertLevel: 0, maxAlertLevel: 0, text: 'Esto que estás atravesando tiene un después, aunque ahora no lo veas.' },
  { category: 'hope', tone: 'CALM', minAlertLevel: 0, maxAlertLevel: 0, text: 'No hace falta creer del todo. Basta con seguir un poco más.' },

  // ── companionship (alert levels 1-3) ─────────────────────────────────────
  { category: 'companionship', tone: 'WARM', minAlertLevel: 1, maxAlertLevel: 3, text: 'PULSO está aquí contigo.' },
  { category: 'companionship', tone: 'WARM', minAlertLevel: 1, maxAlertLevel: 3, text: 'Quizá nadie más sepa que estás intentando cambiar esto. PULSO sí lo sabe.' },
  { category: 'companionship', tone: 'WARM', minAlertLevel: 1, maxAlertLevel: 3, text: 'No te estoy pidiendo que seas fuerte durante todo el día. Solo quédate conmigo durante estos próximos minutos.' },
  { category: 'companionship', tone: 'WARM', minAlertLevel: 1, maxAlertLevel: 3, text: 'No tienes que hacer esto solo en este momento.' },
  { category: 'companionship', tone: 'CALM', minAlertLevel: 1, maxAlertLevel: 3, text: 'Estoy aquí, aunque no tenga que decir mucho más.' },
  { category: 'companionship', tone: 'WARM', minAlertLevel: 1, maxAlertLevel: 3, text: 'No tienes que hacer nada todavía. Solo quería recordarte que este momento también puede pasar.' },
  { category: 'companionship', tone: 'WARM', minAlertLevel: 1, maxAlertLevel: 3, text: 'Hey. Este suele ser uno de tus momentos difíciles. No tienes que resolver nada ahora. Solo haz una pausa conmigo.' },
  { category: 'companionship', tone: 'CALM', minAlertLevel: 1, maxAlertLevel: 3, text: 'Este momento parece importante. PULSO quiere acompañarte.' },
  { category: 'companionship', tone: 'WARM', minAlertLevel: 1, maxAlertLevel: 3, text: 'Sea lo que sea que decidas en los próximos minutos, no lo vas a atravesar sin compañía.' },
  { category: 'companionship', tone: 'CALM', minAlertLevel: 1, maxAlertLevel: 3, text: 'Aquí sigo, por si este momento se siente más pesado de lo normal.' },

  // ── reminder (alert level 1) ──────────────────────────────────────────
  { category: 'reminder', tone: 'CALM', minAlertLevel: 1, maxAlertLevel: 1, text: 'Esto también va a pasar.' },
  { category: 'reminder', tone: 'CALM', minAlertLevel: 1, maxAlertLevel: 1, text: 'No tienes que decidir nada grande ahora. Solo este momento.' },
  { category: 'reminder', tone: 'CALM', minAlertLevel: 1, maxAlertLevel: 1, text: 'Un recordatorio breve: puedes esperar unos minutos antes de decidir.' },
  { category: 'reminder', tone: 'CALM', minAlertLevel: 1, maxAlertLevel: 1, text: 'El impulso tiende a bajar de intensidad si le das un poco de tiempo.' },
  { category: 'reminder', tone: 'CALM', minAlertLevel: 1, maxAlertLevel: 1, text: 'No hace falta una respuesta inmediata.' },
  { category: 'reminder', tone: 'CALM', minAlertLevel: 1, maxAlertLevel: 1, text: 'Esto que sientes tiene una curva, y ya vas de bajada aunque no lo sientas todavía.' },
  { category: 'reminder', tone: 'CALM', minAlertLevel: 1, maxAlertLevel: 1, text: 'Recuerda: el impulso no es una orden.' },
  { category: 'reminder', tone: 'CALM', minAlertLevel: 1, maxAlertLevel: 1, text: 'Puedes seguir con lo que estabas haciendo. Esto puede esperar un poco.' },
  { category: 'reminder', tone: 'CALM', minAlertLevel: 1, maxAlertLevel: 1, text: 'A veces solo hace falta notar el momento para que pese menos.' },
  { category: 'reminder', tone: 'CALM', minAlertLevel: 1, maxAlertLevel: 1, text: 'Este es uno de esos momentos en los que ayuda simplemente hacer una pausa.' },

  // ── craving_intervention (alert level 3 — invites starting the session) ─
  { category: 'craving_intervention', tone: 'CALM', minAlertLevel: 3, maxAlertLevel: 3, text: 'Parece que estás entrando en uno de tus momentos difíciles. ¿Hacemos una pausa?' },
  { category: 'craving_intervention', tone: 'CALM', minAlertLevel: 3, maxAlertLevel: 3, text: 'Este es un buen momento para atravesar esto acompañado. ¿Empezamos?' },
  { category: 'craving_intervention', tone: 'WARM', minAlertLevel: 3, maxAlertLevel: 3, text: 'No tienes que resolver esto solo. PULSO puede acompañarte unos minutos.' },
  { category: 'craving_intervention', tone: 'CALM', minAlertLevel: 3, maxAlertLevel: 3, text: 'Si quieres, podemos atravesar este momento juntos, paso a paso.' },
  { category: 'craving_intervention', tone: 'CALM', minAlertLevel: 3, maxAlertLevel: 3, text: 'Parece un momento intenso. ¿Quieres que lo hagamos juntos unos minutos?' },
  { category: 'craving_intervention', tone: 'CALM', minAlertLevel: 3, maxAlertLevel: 3, text: 'Esto puede ayudar ahora mismo: una pausa corta, acompañada.' },
  { category: 'craving_intervention', tone: 'WARM', minAlertLevel: 3, maxAlertLevel: 3, text: 'No hace falta que decidas nada todavía. Solo acompáñame unos minutos.' },
  { category: 'craving_intervention', tone: 'CALM', minAlertLevel: 3, maxAlertLevel: 3, text: 'Este momento suele ser de los difíciles para ti. Podemos atravesarlo juntos.' },
  // ── craving_intervention (alert level 4 — emergency 5-minute accompaniment) ─
  { category: 'craving_intervention', tone: 'SERIOUS', minAlertLevel: 4, maxAlertLevel: 4, text: 'PULSO ESTÁ CONTIGO\n\nEste suele ser uno de tus momentos más difíciles.\n\nNo tomes ninguna decisión durante los próximos 5 minutos.' },
  { category: 'craving_intervention', tone: 'SERIOUS', minAlertLevel: 4, maxAlertLevel: 4, text: 'Esto es intenso ahora mismo. No decidas nada todavía. Quédate 5 minutos conmigo.' },
  { category: 'craving_intervention', tone: 'SERIOUS', minAlertLevel: 4, maxAlertLevel: 4, text: 'Este es uno de esos momentos que pide compañía, no respuestas. Vamos a atravesarlo juntos.' },

  // ── relapse_recovery (triggered after a craving resolves as SMOKED) ────
  { category: 'relapse_recovery', tone: 'WARM', minAlertLevel: 0, maxAlertLevel: 0, text: 'Esto no borra lo que ya construiste.' },
  { category: 'relapse_recovery', tone: 'WARM', minAlertLevel: 0, maxAlertLevel: 0, text: 'Un cigarro no deshace todos los momentos que sí atravesaste.' },
  { category: 'relapse_recovery', tone: 'CALM', minAlertLevel: 0, maxAlertLevel: 0, text: 'No hace falta empezar de cero. Puedes seguir desde aquí.' },
  { category: 'relapse_recovery', tone: 'CALM', minAlertLevel: 0, maxAlertLevel: 0, text: 'Esto pasó. Lo que sigue es lo que decides ahora.' },
  { category: 'relapse_recovery', tone: 'WARM', minAlertLevel: 0, maxAlertLevel: 0, text: 'No estás otra vez en el punto de partida, aunque se sienta así.' },
  { category: 'relapse_recovery', tone: 'CALM', minAlertLevel: 0, maxAlertLevel: 0, text: 'Lo que aprendiste en este momento también cuenta para el próximo.' },
  { category: 'relapse_recovery', tone: 'WARM', minAlertLevel: 0, maxAlertLevel: 0, text: 'No tienes que explicarte ni castigarte por esto. Solo seguir.' },
  { category: 'relapse_recovery', tone: 'CALM', minAlertLevel: 0, maxAlertLevel: 0, text: 'Un momento no define el resto del camino.' },
  { category: 'relapse_recovery', tone: 'WARM', minAlertLevel: 0, maxAlertLevel: 0, text: 'Puedes retomar esto ahora mismo, sin esperar a mañana.' },
  { category: 'relapse_recovery', tone: 'WARM', minAlertLevel: 0, maxAlertLevel: 0, text: 'Lo que pasó ya pasó. PULSO sigue aquí para lo que sigue.' },
];

async function main() {
  console.log(`Seeding ${templates.length} message templates...`);
  await prisma.messageTemplate.deleteMany();
  await prisma.messageTemplate.createMany({ data: templates });
  console.log('Done.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
