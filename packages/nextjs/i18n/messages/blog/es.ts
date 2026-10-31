import type { BlogMessages } from "./shared";
import { plural } from "~~/i18n/format";

/** "cada 5 minutos", "cada minuto". */
const esEveryMinutes = (minutes: number) =>
  plural("es", minutes, { one: "cada minuto", other: `cada ${minutes} minutos` });

/** "en 22 redes", "en 1 red". */
const esOnNetworks = (networks: number) =>
  plural("es", networks, { one: `en ${networks} red`, other: `en ${networks} redes` });

export const MESSAGES: BlogMessages = {
  crumbs: { home: "Inicio", blog: "Blog" },
  index: {
    title: "Guías del factor de salud y la liquidación en Aave y Morpho",
    description:
      "Guías sobre el factor de salud en Aave y Morpho, liquidaciones, precios de liquidación y alertas, con ejemplos resueltos y cifras con fecha y fuente.",
    kicker: "Guías de Aave y Morpho",
    lead: "Cómo funciona el factor de salud en Aave y en Morpho, qué pasa en una liquidación, cómo calcular tu precio de liquidación y cómo recibir un aviso antes de que el precio se acerque a ese nivel. Cada cifra de estas guías indica su fuente y la fecha en que se verificó.",
    dashboardCta: "Abrir el panel de Aave",
    morphoDashboardCta: "Abrir el panel de Morpho",
    rss: "Suscribirse por RSS",
    startHere: "Empieza aquí",
    allGuides: "Todas las guías",
    empty: {
      title: "Aún no hay guías",
      description: "Estamos preparando las guías en español. Suscríbete por RSS para recibirlas cuando se publiquen.",
      otherLanguage: "Leer las guías en inglés",
    },
  },
  post: {
    kicker: "Guía de Aave V3",
    morphoKicker: "Guía de Morpho",
    byline: { author: "Por el equipo de Tokenping", published: "Publicado", updated: "Actualizado" },
    readingTime: minutes => `${minutes} min de lectura`,
    readGuide: "Leer la guía",
    related: "Guías relacionadas",
  },
  endBox: {
    label: "Sobre Tokenping",
    title: "Alertas del factor de salud con Tokenping",
    body: ({ minutes, networks, channels, price, paymentChain }) =>
      `Tokenping revisa el factor de salud de tus posiciones en Aave V3 y V4 ${esEveryMinutes(minutes)} ${esOnNetworks(networks)} y te envía un mensaje por ${channels} cuando está por debajo de tu umbral. Las alertas cuestan ${price}${paymentChain ? `, con pago en la red ${paymentChain}` : ""}; ver tus posiciones no requiere pago. Las alertas te dan tiempo para actuar, pero no evitan la liquidación.`,
    cta: "Abrir el panel",
    morpho: {
      title: "Alertas del factor de salud en Morpho con Tokenping",
      body: ({ minutes, networks, channels, price, paymentChain }) =>
        `Tokenping revisa el factor de salud de tus préstamos en Morpho Blue y Midnight ${esEveryMinutes(minutes)} ${esOnNetworks(networks)} y te envía un mensaje por ${channels} cuando está por debajo de tu umbral, con recordatorios antes de que venza un préstamo a tasa fija. Las alertas cuestan ${price}${paymentChain ? `, con pago en la red ${paymentChain}` : ""}, el mismo plan que las alertas de Aave; ver tus posiciones no requiere pago. Las alertas te dan tiempo para actuar, pero no evitan la liquidación.`,
      cta: "Abrir el panel de Morpho",
    },
  },
  alertPrice: {
    fallback: "una pequeña tarifa en USDC (consulta el precio actual en el panel)",
    plan: ({ priceLabel, days }) => `${priceLabel} por ${plural("es", days, { one: "día", other: `${days} días` })}`,
  },
  callout: { info: "Nota", warning: "Advertencia" },
  shortAnswer: "Respuesta breve",
  scopeNote: {
    text: "Se aplica a Aave V3.7 y se verificó en los mercados Ethereum Core, Arbitrum, Base, Optimism, Polygon, Avalanche y Gnosis. Otros mercados y redes de V3 pueden usar versiones anteriores. Las diferencias de Aave V4 se indican donde las reglas no son las mismas.",
    morphoText:
      "Se aplica a los mercados de Morpho Blue y Morpho Midnight que figuran en la aplicación de Morpho. Cada mercado define su propio colateral, oráculo y LLTV, así que revisa las cifras del tuyo.",
    figuresAsOf: "Cifras consultadas el",
  },
  table: {
    fallbackLabel: "Tabla, se desplaza en horizontal",
    label: (heading, index) => (index === undefined ? `Tabla: ${heading}` : `Tabla ${index}: ${heading}`),
    scrollHint: "Desplázate hacia los lados para ver todas las columnas.",
  },
};
