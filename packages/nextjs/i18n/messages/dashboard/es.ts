import type { DashboardMessages } from "./shared";
import { esMarket, plural } from "~~/i18n/format";

export const MESSAGES: DashboardMessages = {
  page: {
    metaTitle: "Posiciones y factor de salud en Aave V3 y V4",
    metaDescription: (networkCount, channels) =>
      `Tu colateral, tu deuda y tu factor de salud en Aave V3 y V4, en ${networkCount} redes, con alertas por ${channels} y un umbral por mercado.`,
    title: "Posiciones en Aave V3 y V4 y alertas del factor de salud",
    networkMarkets: (name, markets) => `${name} (mercados ${markets})`,
    intro: (v3Networks, v4Networks) =>
      `Conecta la billetera con la que pides prestado para ver su colateral, su deuda y su factor de salud en Aave V3 en las redes ${v3Networks}, y en todos los Spokes de Aave V4 en las redes ${v4Networks}. Consultarlos no requiere ninguna transacción.`,
    disclosureSummary: "Cuánto cuestan las alertas y cada cuánto revisamos",
    alertsCost: (channels, paymentChain) =>
      `Para recibir un mensaje por ${channels} cuando el factor de salud de un mercado caiga por debajo de un umbral que tú elijas, desbloquea las alertas con un pago en USDC${paymentChain ? ` en la red ${paymentChain}` : ""}. El precio actual se muestra antes de pagar.`,
    checks: (minutes, repeatMinutes) =>
      `Tokenping revisa ${plural("es", minutes, { one: "cada minuto", other: `cada ${minutes} minutos` })}. Mientras el factor de salud siga por debajo de tu umbral, recibes un mensaje cada ${repeatMinutes} minutos por cada canal que elegiste.`,
    guideThreshold: "Cómo elegir un umbral",
    guideAlerts: "Cómo funcionan las alertas",
    morphoDashboard: "¿Pides prestado en Morpho? Abre el panel de Morpho",
  },
  gate: {
    title: "Conecta una billetera para continuar",
    description:
      "Tokenping necesita la dirección de tu billetera para mostrar tus posiciones en Aave. Conectarla no mueve fondos ni cobra ninguna comisión.",
    connect: "Conectar billetera",
    connecting: "Conectando",
    approveInWallet: "Aprueba la conexión en tu billetera.",
  },
  positionsHeading: "Tus posiciones en Aave",
  loadingDashboard: "Cargando tu panel",
  toolbar: {
    wallet: "Billetera",
    refresh: "Actualizar posiciones",
    refreshing: "Actualizando",
    loadingPositions: "Cargando posiciones",
  },
  errors: {
    positionsDidNotLoad: "Las posiciones no se cargaron",
    refreshFailed: "No se pudo actualizar",
    showingLastPositions: "Se muestran las posiciones de la última carga correcta.",
    tryAgain: "Intentar de nuevo",
    fetchPositionsFailed: "No se pudieron obtener las posiciones de Aave",
  },
  totals: {
    supplied: "Total depositado",
    borrowed: "Deuda total",
    netWorth: "Patrimonio neto",
    noData: "Sin datos",
  },
  networks: {
    heading: "Mercados",
    active: count => plural("es", count, { one: `${count} activo`, other: `${count} activos` }),
    noPositions: "No se detectaron posiciones activas en Aave en los mercados compatibles.",
    selectedRegion: "Mercado seleccionado",
    noneSelectedTitle: "Ningún mercado seleccionado",
    noneSelectedDescription: "Selecciona un mercado para ver su posición en Aave.",
    otherMarkets: count => `Otros mercados (${count})`,
    otherMarketsHint: "Mercados que Tokenping revisó donde esta billetera no tiene ninguna posición ni alerta.",
    alertSet: "Alerta configurada",
    supplied: usd => `${usd} depositados,`,
    borrowed: usd => `${usd} de deuda`,
    noPosition: "Sin posición",
  },
  healthFactor: {
    srPrefix: "Factor de salud ",
    noDebt: "Sin deuda",
    critical: "Crítico",
    risky: "En riesgo",
    safe: "Seguro",
  },
  position: {
    market: version => (version === 4 ? "Spoke de Aave V4" : "Mercado de Aave V3"),
    noPositionTitle: chainName => `No tienes ninguna posición activa en ${esMarket(chainName)}`,
    noPositionDetail: chainName => `Según Aave, esta billetera no tiene colateral ni deuda en ${esMarket(chainName)}.`,
    collateral: "Colateral",
    debt: "Deuda",
    netWorth: "Patrimonio neto",
    suppliedTitle: "Depositado",
    borrowedTitle: "Deuda",
    noCollateral: "No hay colateral depositado",
    noDebt: "No hay deuda pendiente",
    tokenIconsFrom: "Iconos de tokens y redes de",
    tokenDetailsFailedTitle: "Los detalles de los tokens no se cargaron",
    tokenDetailsFailedBody:
      "Los totales de arriba vienen del resumen de cuenta de Aave. Actualiza las posiciones para intentarlo de nuevo.",
  },
  tokens: {
    asset: "Activo",
    supplied: "Depositado",
    supplyApy: "APY de depósito",
    collateral: "Colateral",
    borrowed: "Deuda",
    rateType: "Tipo de tasa",
    enabled: "Activado",
    disabled: "Desactivado",
    stable: amount => `Estable ${amount}`,
    variable: amount => `Variable ${amount}`,
    count: count => plural("es", count, { one: `${count} activo`, other: `${count} activos` }),
  },
  address: {
    defaultLabel: "Dirección",
    copy: (_label, address) => `Copiar la dirección ${address}`,
    copied: "Dirección copiada",
    copyFailed: "No se pudo copiar. Selecciona la dirección y cópiala a mano.",
  },
  opensInNewTab: "(se abre en una pestaña nueva)",
  paywall: {
    unlockedUntil: date => `Alertas desbloqueadas hasta el ${date}`,
    titleNew: "Desbloquea las alertas del factor de salud",
    titleExtend: "Extiende el acceso para editar tus alertas",
    descriptionNew:
      "Paga una vez para desbloquear la configuración de alertas y fijar un umbral del factor de salud para cada red. Nada se renueva automáticamente: pagas desde tu billetera cuando quieras extender el acceso.",
    descriptionExtend:
      "Tu configuración de alertas anterior está guardada. Paga de nuevo para extender el acceso y editarla.",
    networkDescriptionNew: chainName =>
      `Paga una vez para configurar alertas del factor de salud en ${esMarket(chainName)} y en otros mercados. Nada se renueva automáticamente: pagas desde tu billetera cuando quieras extender el acceso.`,
    networkDescriptionExtend: chainName =>
      `Tu configuración de alertas guardada para ${esMarket(chainName)} sigue en tu cuenta. Paga de nuevo para extender el acceso y editarla.`,
    connectWallet: "Conecta tu billetera para pagar el acceso.",
    unconfigured: "El contrato de pago no está configurado para esta red.",
    noPlan: "No hay ningún plan de pago disponible en este momento.",
    paused: "Los pagos están pausados ahora mismo. Inténtalo más tarde.",
    statusUnavailable: "No se pudo cargar el estado del pago. Recarga la página para intentarlo de nuevo.",
    wrongNetworkTitle: "Red incorrecta",
    wrongNetworkBody: (walletChain, target) =>
      `Tu billetera está en ${walletChain ? `la red ${walletChain}` : "otra red"}. Cambia a ${target ? `la red ${target}` : "la red de pago"} para pagar.`,
    switchTo: target => `Cambiar a ${target ? `la red ${target}` : "la red de pago"}`,
    switching: "Cambiando de red",
    loadingDetails: "Cargando los detalles del pago",
    price: "Precio",
    access: "Acceso",
    network: "Red",
    networkFee: "Comisión de red",
    networkFeeValue: symbol => `Se paga en ${symbol} en cada paso y se muestra en tu billetera`,
    period: (days, about) => {
      const period = plural("es", days, { one: `${days} día`, other: `${days} días` });
      return about ? `Aproximadamente ${period}` : period;
    },
    pay: amount => `Pagar ${amount}`,
    extend: (days, amount) =>
      `Agregar ${plural("es", days, { one: `${days} día`, other: `${days} días` })} por ${amount}`,
    extendHint: days =>
      `Cada pago agrega ${plural("es", days, { one: `${days} día`, other: `${days} días` })} a partir de la fecha en que termina tu acceso actual. Paga tantas veces como quieras; nada se renueva solo.`,
    accessExtended: date => `Acceso extendido hasta el ${date}.`,
    accessActive: "Acceso activo. Ya puedes configurar las alertas.",
    paymentPending: "Pago confirmado. El acceso aparecerá en breve.",
    loading: {
      processing: "Procesando",
      waitingForWallet: "Esperando tu billetera",
      approving: "Aprobando",
      paying: "Pagando",
    },
    unavailable: "El acceso de pago no está disponible ahora mismo.",
    checkFailed: "No se pudo verificar el estado del pago. Inténtalo de nuevo en un momento.",
    approvalNotVisible: "La aprobación está confirmada, pero aún no se ve. Inténtalo de nuevo en un momento.",
  },
  payment: {
    stepsLabel: "Pasos del pago",
    approveTitle: amount => `Aprobar ${amount}`,
    approveHint:
      "Permite que el contrato de pago tome exactamente este monto. Se omite si una aprobación anterior ya lo cubre.",
    payTitle: amount => `Pagar ${amount}`,
    payHint: "Envía el pago y desbloquea las alertas.",
    inProgress: "En curso",
    done: "Listo",
    notNeeded: "No hace falta",
    transaction: "Transacción ",
    viewOn: explorer => `Ver en ${explorer}`,
    preparingTitle: "Preparando el pago",
    preparingBody: "Verificando el precio actual y tu aprobación.",
    confirmTitle: "Confirma en tu billetera",
    approveSignBody: amount => `Paso 1 de 2: aprobar ${amount}. No se envía nada hasta que confirmes.`,
    processingOn: network => (network ? `Procesando en la red ${network}` : "Procesando en la red"),
    approvePendingBody:
      "Paso 1 de 2: aprobación enviada. A continuación, tu billetera te pedirá que confirmes el pago.",
    paySignBody: amount => `Paso 2 de 2: pagar ${amount}. No se envía nada hasta que confirmes.`,
    payPendingBody: "Paso 2 de 2: pago enviado. Las alertas se desbloquean cuando la red lo confirme.",
  },
};
