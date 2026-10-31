import { type HomeMessages, rich } from "./shared";
import { capitalize, plural } from "~~/i18n/format";

/** "30 días", "1 día". */
const esDays = (days: number) => plural("es", days, { one: `${days} día`, other: `${days} días` });

/** "cada 5 minutos", "cada minuto". */
const esEveryMinutes = (minutes: number) =>
  plural("es", minutes, { one: "cada minuto", other: `cada ${minutes} minutos` });

/** "29 redes", "1 red". */
const esNetworks = (networks: number) => plural("es", networks, { one: `${networks} red`, other: `${networks} redes` });

/** "24 mercados", "1 mercado". */
const esMarkets = (markets: number) =>
  plural("es", markets, { one: `${markets} mercado`, other: `${markets} mercados` });

/** "13 Spokes", "1 Spoke". */
const esSpokes = (spokes: number) => plural("es", spokes, { one: `${spokes} Spoke`, other: `${spokes} Spokes` });

/** "en la red Arbitrum One", or the payment network unnamed. */
const esOnChain = (chainName: string | undefined) => (chainName ? `en la red ${chainName}` : "en la red de pago");

export const MESSAGES: HomeMessages = {
  headline: channels => `Alertas del factor de salud en Aave y Morpho por ${channels}`,
  description: ({ channels, networks, minutes, short }) =>
    short
      ? `Alertas por ${channels} si tu factor de salud en Aave o Morpho está por debajo de tu umbral, en ${esNetworks(networks)}, ${esEveryMinutes(minutes)}.`
      : `Alertas por ${channels} si tu factor de salud en Aave o Morpho cae por debajo de tu umbral, en ${esNetworks(networks)}. Revisión ${esEveryMinutes(minutes)}.`,
  channelBadge: capitalize,
  pricingCta: plan => (plan ? `Configurar alertas: ${plan.priceLabel} por ${esDays(plan.days)}` : "Configurar alertas"),
  offerDescription: ({ days, currency }) =>
    `Alertas del factor de salud por ${esDays(days)}, pagadas en ${currency} desde tu billetera. Sin renovación automática.`,

  kicker: "Aave V3 y V4, Morpho Blue y Midnight",
  heroLead: ({ minutes, channels }) =>
    `Revisión ${esEveryMinutes(minutes)}. Un mensaje por ${channels} mientras sigas por debajo de tu límite. Solo lectura, sin aprobaciones.`,
  networksLabel: "Redes",
  heroCoverage: networks => esNetworks(networks),
  channelsLabel: "Alertas por:",
  exampleAlertLabel: "Qué dice una alerta",
  exampleAlertCaption: subject => `Ejemplo. Los correos llegan con el asunto "${subject}".`,

  dashboardCta: "Abrir el panel de Aave",
  morphoDashboardCta: "Abrir el panel de Morpho",
  dashboardCtaMicrocopy: alertPrice =>
    `Conecta tu billetera y ve todas tus posiciones. Las alertas cuestan ${alertPrice}.`,

  problemTitle: "El factor de salud cae mientras duermes",
  problemLead:
    "Aave muestra tu factor de salud, pero no envía alertas (octubre de 2026). Tres cosas lo mueven durante la noche:",
  problemCauses: [
    { title: "Bajan los precios", body: "ETH cae y tu colateral vale menos." },
    { title: "Se acumulan intereses", body: "Tu deuda crece cada segundo." },
    { title: "Cambian los umbrales", body: "En Aave, la gobernanza puede recortar un umbral de liquidación." },
  ],
  problemEvidence: ({ morning, failedRepays, polygon }) =>
    rich(
      "Hay prestatarios que cuentan que ",
      morning("despertaron con la posición liquidada"),
      ", que ",
      failedRepays("sus transacciones para pagar la deuda fallaron durante una hora"),
      " y que ",
      polygon("un pago con el factor de salud en 1.01 llegó demasiado tarde"),
      ".",
    ),
  problemLiquidator: guide =>
    rich(
      "Además, el liquidador se queda con una bonificación: 5% sobre WETH en el mercado Core en Ethereum (octubre de 2026).",
      guide && rich(" Consulta ", guide("cómo funciona una liquidación"), "."),
    ),
  chart: {
    threshold: "tu umbral",
    liquidation: "liquidación",
    alertSent: "Alerta enviada",
    youCheck: "Revisas tu teléfono",
    caption:
      "Una noche de ejemplo. La alerta sale a las 03:05, en la primera revisión por debajo de 1.5, cinco horas antes de que mires.",
  },

  howItWorksTitle: "Cómo funciona",
  steps: ({ plan, paymentChain, minutes, channels, threshold, morphoMin }) => {
    const paidOn = paymentChain ? ` en la red ${paymentChain}` : "";
    return [
      {
        title: "Conecta la billetera con la que pides prestado",
        body: "Solo lectura. Aave y Morpho, cada uno en su página.",
      },
      {
        title: plan
          ? `Desbloquea las alertas por ${plan.priceLabel}`
          : "Desbloquea las alertas con un pequeño pago en USDC",
        body: `${plan ? `Acceso por ${esDays(plan.days)}, pagado` : "Pago"} en USDC${paidOn}. Sin renovación automática.`,
      },
      {
        title: "Elige un límite para cada mercado",
        body: `Desde ${threshold.min} (${morphoMin} en Morpho) hasta ${threshold.max}, ${threshold.default} por defecto.`,
      },
      {
        title: "Recibe un mensaje mientras estés por debajo",
        body: `${capitalize(esEveryMinutes(minutes))}, por ${channels}, hasta que vuelvas a superar tu límite.`,
      },
    ];
  },
  scaleTitle: "Dónde poner tu límite",
  scale: {
    liquidation: "liquidación",
    critical: "Crítico",
    risky: "En riesgo",
    safe: "Seguro",
    defaultThreshold: value => `Por defecto: ${value}`,
    below: value => `Menos de ${value}`,
    between: (from, to) => `De ${from} a ${to}`,
    andAbove: value => `${value} o más`,
    range: (min, max) => `Cualquier valor de ${min} a ${max}.`,
  },
  scaleGuide: "Cómo elegir un umbral",

  coverageTitle: "Todos los mercados de Aave y todos los mercados listados de Morpho",
  coverageLead: ({ v3Markets, v3Networks, spokes, v4Networks, morphoNetworks }) =>
    `${esMarkets(v3Markets)} de Aave V3 en ${esNetworks(v3Networks)} y ${esSpokes(spokes)} de Aave V4 en ${esNetworks(v4Networks)}, a 16 de octubre de 2026, además de todos los mercados listados de Morpho en ${esNetworks(morphoNetworks)}.`,
  coverage: {
    v3Markets: count => `${esMarkets(count)} V3`,
    v4Spokes: count => `${esSpokes(count)} V4`,
    morpho: "Morpho",
  },
  coverageNote:
    "La gobernanza de Aave está retirando poco a poco los mercados en Scroll, ZKsync, Metis, Soneium y Sonic, y los seguimos vigilando. No cubrimos Aave V3 en Harmony, los mercados de Morpho no listados ni otros protocolos.",

  pricingTitle: "Precios",
  pricingRows: ({ alertPrice, paymentChain }) => [
    { term: "Alertas", detail: capitalize(alertPrice) },
    { term: "Renovación", detail: "No es automática: vuelve a pagar cuando quieras más tiempo" },
    {
      term: "Pago",
      detail: paymentChain
        ? `USDC en la red ${paymentChain}, desde tu billetera (aprobación y luego pago)`
        : "USDC, desde tu billetera",
    },
  ],
  priceSource: "El precio se lee del contrato de pago y se actualiza cada hora.",
  pricingFootnote: "Ver tus posiciones no requiere pago.",

  questionsTitle: "Qué preguntar antes de conectar una billetera",
  questions: ({ alertPrice, paymentChain, hasTelegram, minutes, morphoMin, links }) => {
    const onChain = esOnChain(paymentChain);
    return [
      {
        question: "¿Puede Tokenping tocar mis fondos?",
        answer: rich(
          `No. Tokenping solo lee tus posiciones y nunca pide aprobaciones ni firmas en Aave ni en Morpho. Las únicas transacciones son el pago ${onChain}: una aprobación por exactamente el precio y luego el pago. `,
          links.sourcify
            ? rich(
                "El contrato está ",
                links.sourcify("verificado en Sourcify"),
                " y su ",
                links.sourceCode("código fuente es público"),
              )
            : links.sourceCode("El código fuente del contrato es público"),
          "; la billetera del equipo puede cambiar su precio, pausarlo y actualizarlo.",
        ),
      },
      {
        question: "¿Qué datos se guardan?",
        answer: rich(
          "La dirección de tu billetera, tus alertas y los datos de contacto que nos des (correo electrónico, nombre de usuario de Signal",
          hasTelegram ? ", chat de Telegram" : "",
          `). Sin historial y sin cookies de seguimiento; las visitas se cuentan de forma anónima. Solo quien pueda firmar con tu billetera puede leer esos datos de contacto, pero los pagos son públicos ${onChain}. La `,
          links.privacy("página de privacidad"),
          " tiene la lista completa.",
        ),
      },
      {
        question: "¿Cuánto cuesta?",
        answer: rich(
          `Las alertas cuestan ${alertPrice}, en USDC ${onChain}, más un poco de ETH para el gas. Ver tus posiciones no requiere pago. Sin renovación automática y sin reembolsos.`,
        ),
      },
      {
        question: "¿Qué préstamos de Morpho se cubren?",
        answer: rich(
          `Préstamos de Morpho Blue (tasa variable) y Morpho Midnight (tasa fija) en los mercados que lista la aplicación de Morpho, con umbrales desde ${morphoMin}. Un préstamo a tasa fija también recibe recordatorios antes del vencimiento. El mismo plan los cubre: abre el `,
          links.morphoDashboard("panel de Morpho"),
          ".",
        ),
      },
      {
        question: "¿Y si una alerta no llega?",
        answer: rich(
          `La siguiente revisión, ${plural("es", minutes, { one: "1 minuto", other: `${minutes} minutos` })} después, lo vuelve a intentar. La entrega depende de Resend, un relay de Signal,`,
          hasTelegram ? " la Telegram Bot API," : "",
          " nodos RPC públicos y el programador de tareas de Vercel, sin garantía de disponibilidad. Elige dos canales y deja margen para actuar.",
        ),
      },
      {
        question: "¿Cómo detengo las alertas?",
        answer: rich(
          "Se detienen cuando tu factor de salud vuelve a estar por encima de tu límite, o cuando eliminas la alerta (requiere acceso activo). ¿Expiró tu acceso? Escríbenos en ",
          links.x("X"),
          " o en nuestra comunidad de ",
          links.telegramCommunity("Telegram"),
          " o de ",
          links.signalCommunity("Signal"),
          ".",
          hasTelegram ? " En Telegram, /stop también funciona." : "",
          " Todavía no hay forma de posponerlas ni enlace para darte de baja.",
        ),
      },
      {
        question: "¿Puedo vigilar una billetera que no conecto?",
        answer: rich("Por ahora no. Una billetera, la que conectas; el acceso es por billetera."),
      },
      {
        question: "Otras herramientas no cuestan nada. ¿Por qué pagar?",
        answer: rich(
          "Si te basta con un bot de Telegram o una aplicación móvil, úsalos",
          links.comparison ? rich(": ", links.comparison("nuestra comparativa"), " los repasa") : null,
          ". Tokenping es para alertas por Signal o correo electrónico, en cada mercado de Aave y cada mercado listado de Morpho.",
        ),
      },
    ];
  },

  limitsTitle: "Límites, sin rodeos",
  limits: ({ minutes, paymentChain }) => [
    `Revisiones ${esEveryMinutes(minutes)}, no de forma continua.`,
    "Cada revisión por debajo de tu límite envía otro mensaje: sin opción de posponer ni resumen.",
    "Un límite por mercado, solo para la billetera conectada.",
    `Solo USDC${paymentChain ? ` en la red ${paymentChain}` : ""}: sin tarjetas, sin reembolsos.`,
    "Los correos aún no tienen enlace para darte de baja; eliminar una alerta requiere acceso activo.",
    "Beta: entrega a través de terceros, sin garantía de disponibilidad.",
  ],

  blogTitle: "Del blog",
  allGuides: "Todas las guías de Aave y Morpho",

  closingTitle: "Configura tu alerta del factor de salud en Aave o Morpho",
  closingLead: alertPrice => `${capitalize(alertPrice)}, con pago desde tu billetera. Sin renovación automática.`,
};
