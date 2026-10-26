import { csForMarket, csOnMarket, plural } from "~~/i18n/format";
import type { Localized } from "~~/i18n/locales";
import type { GateMessages } from "~~/i18n/messages/dashboard";

// The /morpho dashboard. Plain functional copy; the wording of the product pages around it is left to the SEO pass.
// Amounts in the dashboard keep the app's number format, as on /aave.

type MorphoMessages = {
  page: {
    metaTitle: string;
    metaDescription: (networkCount: number, channels: string) => string;
    title: string;
    /** `networks` is the list of Morpho's networks, joined. */
    intro: (networks: string) => string;
    checks: (minutes: number) => string;
    access: string;
    notAffiliated: string;
    guideHealthFactor: string;
    guideLiquidation: string;
    guideMidnight: string;
    /** The link to the Aave dashboard, for a borrower who is on the wrong page. */
    aaveDashboard: string;
  };
  positionsHeading: string;
  gate: GateMessages;
  list: {
    heading: string;
    count: (count: number) => string;
    none: string;
    discoveryFailed: string;
    variableRate: string;
    fixedRate: string;
    matures: (date: string) => string;
    matured: string;
    unreadable: string;
    noneSelectedDescription: string;
  };
  details: {
    collateralValue: string;
    debt: string;
    ltv: string;
    lltv: string;
    maturity: string;
    timeLeft: (days: number, hours: number) => string;
    pastMaturity: string;
    preLiquidation: string;
    preLiquidationNote: string;
    amountsIn: (token: string) => string;
    noDebtTitle: string;
    noDebtDetail: string;
    unreadableTitle: string;
    unreadableDetail: string;
  };
  paywall: {
    descriptionNew: (marketName: string) => string;
    descriptionExtend: (marketName: string) => string;
  };
};

export const MORPHO_MESSAGES: Localized<MorphoMessages> = {
  en: {
    page: {
      metaTitle: "Morpho health factor alerts for Blue and Midnight loans",
      metaDescription: (networkCount, channels) =>
        `Health factor alerts for Morpho Blue and Midnight loans by ${channels}, on ${networkCount} networks, with reminders before a fixed-rate loan matures.`,
      title: "Morpho Blue and Midnight positions and health factor alerts",
      intro: networks =>
        `Your borrow positions in the markets the Morpho app lists, on ${networks}: variable-rate loans (Morpho Blue) and fixed-rate loans (Morpho Midnight). Health factors are read from the chain.`,
      checks: minutes =>
        `Alerts are checked every ${minutes} minutes. A fixed-rate loan also gets a reminder 7 days and 1 day before it matures, and an alert at every check after maturity while debt remains.`,
      access: "One access payment covers your Aave and Morpho alerts.",
      notAffiliated: "Tokenping is not affiliated with Morpho.",
      guideHealthFactor: "How the Morpho health factor works",
      guideLiquidation: "How Morpho liquidation works",
      guideMidnight: "Morpho Midnight fixed-rate loans",
      aaveDashboard: "Borrowing on Aave? Open the Aave dashboard",
    },
    positionsHeading: "Your Morpho positions",
    gate: {
      title: "Connect a wallet to continue",
      description:
        "Tokenping needs your wallet address to find your Morpho positions. Connecting does not move funds or cost a fee.",
      connect: "Connect wallet",
      connecting: "Connecting",
      approveInWallet: "Approve the connection in your wallet.",
    },
    list: {
      heading: "Markets",
      count: count => `${count} with debt`,
      none: "No borrowing found in the markets the Morpho app lists.",
      discoveryFailed: "Morpho's API did not answer, so only the markets with a saved alert are listed.",
      variableRate: "Variable rate",
      fixedRate: "Fixed rate",
      matures: date => `Matures ${date}`,
      matured: "Past maturity",
      unreadable: "Could not be read",
      noneSelectedDescription: "Select a market to view its Morpho position.",
    },
    details: {
      collateralValue: "Collateral value",
      debt: "Debt",
      ltv: "LTV",
      lltv: "Liquidation LTV",
      maturity: "Maturity",
      timeLeft: (days, hours) =>
        days > 0
          ? plural("en", days, { one: "in 1 day", other: `in ${days} days` })
          : plural("en", hours, { one: "in 1 hour", other: `in ${hours} hours` }),
      pastMaturity:
        "This loan is past maturity: any debt left can be liquidated at any time, whatever its health factor. Repay it to avoid liquidation.",
      preLiquidation: "Pre-liquidation",
      preLiquidationNote:
        "You opted into pre-liquidation on this market, so the health factor is measured against its earlier line: below 1, part of your position can be sold.",
      amountsIn: token => `Amounts are in ${token}, valued by the market's oracle.`,
      noDebtTitle: "No debt in this market",
      noDebtDetail: "A saved alert stays saved, and sends nothing while there is no debt.",
      unreadableTitle: "This position could not be read",
      unreadableDetail: "The network did not answer. Your alert keeps being checked.",
    },
    paywall: {
      descriptionNew: marketName =>
        `Pay once to set health factor alerts on ${marketName} and other markets. Nothing renews automatically: you pay from your wallet when you want to extend.`,
      descriptionExtend: marketName =>
        `Your saved ${marketName} alert settings are still in your account. Pay again to extend access and edit them.`,
    },
  },
  cs: {
    page: {
      metaTitle: "Upozornění na health factor na Morpho Blue a Midnight",
      metaDescription: (networkCount, channels) =>
        `Upozornění na health factor na Morpho Blue a Midnight přes ${channels}, na ${networkCount} sítích, s připomínkou před splatností půjčky.`,
      title: "Pozice a upozornění na health factor na Morpho Blue a Midnight",
      intro: networks =>
        `Vaše vypůjčené pozice v trzích, které uvádí aplikace Morpho, na sítích ${networks}: půjčky s variabilní sazbou (Morpho Blue) a s pevnou sazbou (Morpho Midnight). Health factor se čte přímo z blockchainu.`,
      checks: minutes =>
        `Upozornění kontrolujeme ${plural("cs", minutes, { one: "každou minutu", few: `každé ${minutes} minuty`, other: `každých ${minutes} minut` })}. Půjčka s pevnou sazbou navíc dostane připomínku 7 dní a 1 den před splatností a po splatnosti upozornění při každé kontrole, dokud na ní zbývá dluh.`,
      access: "Jedna platba za přístup pokrývá upozornění na Aave i na Morpho.",
      notAffiliated: "Tokenping není s Morpho nijak spojený.",
      guideHealthFactor: "Jak funguje health factor na Morpho",
      guideLiquidation: "Jak funguje likvidace na Morpho",
      guideMidnight: "Půjčky s pevnou sazbou na Morpho Midnight",
      aaveDashboard: "Půjčujete si na Aave? Otevřete přehled Aave",
    },
    positionsHeading: "Vaše pozice na Morpho",
    gate: {
      title: "Pro pokračování připojte peněženku",
      description:
        "Tokenping potřebuje adresu vaší peněženky, aby našel vaše pozice na Morpho. Připojení nepřesouvá žádné prostředky a nic nestojí.",
      connect: "Připojit peněženku",
      connecting: "Připojování",
      approveInWallet: "Potvrďte připojení v peněžence.",
    },
    list: {
      heading: "Trhy",
      count: count => `${count} s dluhem`,
      none: "V trzích, které uvádí aplikace Morpho, jsme nenašli žádnou půjčku.",
      discoveryFailed: "API Morpho neodpovědělo, proto jsou uvedeny jen trhy s uloženým upozorněním.",
      variableRate: "Variabilní sazba",
      fixedRate: "Pevná sazba",
      matures: date => `Splatnost ${date}`,
      matured: "Po splatnosti",
      unreadable: "Nepodařilo se načíst",
      noneSelectedDescription: "Vyberte trh a zobrazí se jeho pozice na Morpho.",
    },
    details: {
      collateralValue: "Hodnota kolaterálu",
      debt: "Dluh",
      ltv: "LTV",
      lltv: "Likvidační LTV",
      maturity: "Splatnost",
      timeLeft: (days, hours) =>
        days > 0
          ? plural("cs", days, { one: "za 1 den", few: `za ${days} dny`, other: `za ${days} dní` })
          : plural("cs", hours, { one: "za 1 hodinu", few: `za ${hours} hodiny`, other: `za ${hours} hodin` }),
      pastMaturity:
        "Tato půjčka je po splatnosti: jakýkoli zbývající dluh může být kdykoli zlikvidován, bez ohledu na health factor. Splaťte ho, abyste se vyhnuli likvidaci.",
      preLiquidation: "Předběžná likvidace",
      preLiquidationNote:
        "Na tomto trhu jste zapnuli předběžnou likvidaci (pre-liquidation), proto se health factor měří vůči její dřívější hranici: pod 1 může být část vaší pozice prodána.",
      amountsIn: token => `Částky jsou v ${token}, oceněné orákulem trhu.`,
      noDebtTitle: "Na tomto trhu nemáte dluh",
      noDebtDetail: "Uložené upozornění zůstává uložené a bez dluhu nic neposílá.",
      unreadableTitle: "Tuto pozici se nepodařilo načíst",
      unreadableDetail: "Síť neodpověděla. Vaše upozornění se dál kontroluje.",
    },
    paywall: {
      descriptionNew: marketName =>
        `Zaplaťte jednou a nastavte si upozornění na health factor ${csOnMarket(marketName, "market")} i na dalších trzích. Nic se automaticky neobnovuje: když budete chtít přístup prodloužit, zaplatíte znovu ze své peněženky.`,
      descriptionExtend: marketName =>
        `Vaše uložené nastavení upozornění ${csForMarket(marketName, "market")} ve vašem účtu zůstává. Zaplaťte znovu, tím prodloužíte přístup a nastavení můžete upravit.`,
    },
  },
  es: {
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
  },
};
