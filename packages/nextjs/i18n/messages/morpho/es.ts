import type { MorphoMessages } from "./shared";
import { plural } from "~~/i18n/format";

export const MESSAGES: MorphoMessages = {
  page: {
    metaTitle: "Alertas del factor de salud en Morpho Blue y Midnight",
    // 155 characters at most with three channels: Midnight's "(tasa fija)" says which loans have a maturity.
    metaDescription: (networkCount, channels) =>
      `Alertas del factor de salud en Morpho Blue y Midnight (tasa fija) por ${channels}, en ${networkCount} redes, con aviso antes del vencimiento.`,
    title: "Posiciones y alertas del factor de salud en Morpho Blue y Midnight",
    intro: networks =>
      `Tus posiciones con deuda en los mercados que figuran en la aplicación de Morpho, en ${networks}: préstamos a tasa variable (Morpho Blue) y préstamos a tasa fija (Morpho Midnight). El factor de salud se lee directamente de la blockchain.`,
    checks: minutes =>
      `Las alertas se revisan ${plural("es", minutes, { one: "cada minuto", other: `cada ${minutes} minutos` })}. Un préstamo a tasa fija también recibe un recordatorio 7 días y 1 día antes del vencimiento, y una alerta en cada revisión posterior al vencimiento mientras quede deuda.`,
    access: "Un solo pago de acceso cubre tus alertas de Aave y de Morpho.",
    notAffiliated: "Tokenping no está afiliado a Morpho.",
    guideHealthFactor: "Cómo funciona el factor de salud en Morpho",
    guideLiquidation: "Cómo funciona la liquidación en Morpho",
    guideMidnight: "Préstamos a tasa fija en Morpho Midnight",
    aaveDashboard: "¿Pides prestado en Aave? Abre el panel de Aave",
  },
  positionsHeading: "Tus posiciones en Morpho",
  gate: {
    title: "Conecta una billetera para continuar",
    description:
      "Tokenping necesita la dirección de tu billetera para encontrar tus posiciones en Morpho. Conectarla no mueve fondos y no cuesta nada.",
    connect: "Conectar billetera",
    connecting: "Conectando",
    approveInWallet: "Aprueba la conexión en tu billetera.",
  },
  list: {
    heading: "Mercados",
    count: count => `${count} con deuda`,
    none: "No encontramos préstamos en los mercados que figuran en la aplicación de Morpho.",
    discoveryFailed: "La API de Morpho no respondió, así que solo aparecen los mercados con una alerta guardada.",
    variableRate: "Tasa variable",
    fixedRate: "Tasa fija",
    matures: date => `Vence el ${date}`,
    matured: "Vencido",
    unreadable: "No se pudo leer",
    retry: market => `Volver a leer ${market}`,
    noneSelectedDescription: "Selecciona un mercado para ver tu posición en Morpho.",
  },
  details: {
    collateralValue: "Valor del colateral",
    debt: "Deuda",
    ltv: "LTV",
    lltv: "LTV de liquidación",
    maturity: "Vencimiento",
    timeLeft: (days, hours) =>
      days > 0
        ? plural("es", days, { one: "en 1 día", other: `en ${days} días` })
        : plural("es", hours, { one: "en 1 hora", other: `en ${hours} horas` }),
    pastMaturity:
      "Este préstamo ya venció: la deuda que quede puede liquidarse en cualquier momento, sea cual sea el factor de salud. Devuelve el préstamo para evitar la liquidación.",
    preLiquidation: "Preliquidación",
    preLiquidationNote:
      "Activaste la preliquidación en este mercado, así que el factor de salud se mide frente al límite de la preliquidación, que se alcanza antes: por debajo de 1, se puede vender parte de tu posición.",
    amountsIn: token => `Las cantidades están en ${token}, valoradas con el oráculo del mercado.`,
    noDebtTitle: "Sin deuda en este mercado",
    noDebtDetail: "Una alerta guardada sigue guardada y no envía nada mientras no haya deuda.",
    unreadableTitle: "No se pudo leer esta posición",
    unreadableDetail: "La red no respondió. Tu alerta se sigue revisando.",
  },
  paywall: {
    descriptionNew: marketName =>
      `Paga una vez para configurar alertas del factor de salud en el mercado ${marketName} y en otros mercados. Nada se renueva automáticamente: cuando quieras extender el acceso, pagas desde tu billetera.`,
    descriptionExtend: marketName =>
      `La configuración de alertas que guardaste para el mercado ${marketName} sigue en tu cuenta. Paga de nuevo para extender el acceso y editarla.`,
  },
};
