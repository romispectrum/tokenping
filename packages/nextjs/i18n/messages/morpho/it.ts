import type { MorphoMessages } from "./shared";
import { itForMarket, itOnMarket, plural } from "~~/i18n/format";

export const MESSAGES: MorphoMessages = {
  page: {
    metaTitle: "Avvisi sul fattore di salute per Morpho Blue e Midnight",
    metaDescription: (networkCount, channels) =>
      `Avvisi sul fattore di salute per i prestiti Morpho Blue e Midnight via ${channels}, su ${networkCount} reti, con un promemoria prima della scadenza.`,
    title: "Posizioni Morpho Blue e Midnight e avvisi sul fattore di salute",
    intro: networks =>
      `Le tue posizioni di prestito nei mercati elencati dall'app Morpho, su ${networks}: prestiti a tasso variabile (Morpho Blue) e prestiti a tasso fisso (Morpho Midnight). I fattori di salute sono letti dalla blockchain.`,
    checks: minutes =>
      `Gli avvisi vengono controllati ${plural("it", minutes, { one: "ogni minuto", many: `ogni ${minutes} minuti`, other: `ogni ${minutes} minuti` })}. Un prestito a tasso fisso riceve anche un promemoria 7 giorni e 1 giorno prima della scadenza, e un avviso a ogni controllo dopo la scadenza finché resta del debito.`,
    access: "Un solo pagamento di accesso copre i tuoi avvisi Aave e Morpho.",
    notAffiliated: "Tokenping non è affiliato a Morpho.",
    guideHealthFactor: "Come funziona il fattore di salute su Morpho",
    guideLiquidation: "Come funziona la liquidazione su Morpho",
    guideMidnight: "I prestiti a tasso fisso di Morpho Midnight",
    aaveDashboard: "Prendi in prestito su Aave? Apri la dashboard Aave",
  },
  positionsHeading: "Le tue posizioni Morpho",
  gate: {
    title: "Collega un wallet per continuare",
    description:
      "Tokenping ha bisogno dell'indirizzo del tuo wallet per trovare le tue posizioni Morpho. Collegarlo non sposta fondi e non costa commissioni.",
    connect: "Collega wallet",
    connecting: "Collegamento in corso",
    approveInWallet: "Approva il collegamento nel tuo wallet.",
  },
  list: {
    heading: "Mercati",
    count: count => `${count} con debito`,
    none: "Nessun prestito trovato nei mercati elencati dall'app Morpho.",
    discoveryFailed: "L'API di Morpho non ha risposto, quindi sono elencati solo i mercati con un avviso salvato.",
    variableRate: "Tasso variabile",
    fixedRate: "Tasso fisso",
    matures: date => `Scade il ${date}`,
    matured: "Scaduto",
    unreadable: "Lettura non riuscita",
    retry: market => `Riprova a leggere ${market}`,
    noneSelectedDescription: "Seleziona un mercato per vedere la tua posizione Morpho.",
  },
  details: {
    collateralValue: "Valore del collaterale",
    debt: "Debito",
    ltv: "LTV",
    lltv: "LTV di liquidazione",
    maturity: "Scadenza",
    timeLeft: (days, hours) =>
      days > 0
        ? plural("it", days, { one: `tra ${days} giorno`, many: `tra ${days} giorni`, other: `tra ${days} giorni` })
        : plural("it", hours, { one: `tra ${hours} ora`, many: `tra ${hours} ore`, other: `tra ${hours} ore` }),
    pastMaturity:
      "Questo prestito è scaduto: il debito rimasto può essere liquidato in qualsiasi momento, qualunque sia il suo fattore di salute. Rimborsalo per evitare la liquidazione.",
    preLiquidation: "Pre-liquidazione",
    preLiquidationNote:
      "Hai attivato la pre-liquidazione (pre-liquidation) su questo mercato, quindi il fattore di salute si misura sulla sua soglia anticipata: sotto 1, una parte della tua posizione può essere venduta.",
    amountsIn: token => `Gli importi sono in ${token}, valutati dall'oracolo del mercato.`,
    noDebtTitle: "Nessun debito in questo mercato",
    noDebtDetail: "Un avviso salvato resta salvato e non invia nulla finché non c'è debito.",
    unreadableTitle: "Non è stato possibile leggere questa posizione",
    unreadableDetail: "La rete non ha risposto. Il tuo avviso continua a essere controllato.",
  },
  paywall: {
    descriptionNew: marketName =>
      `Paga una volta per impostare avvisi sul fattore di salute ${itOnMarket(marketName, "market")} e su altri mercati. Niente si rinnova in automatico: paghi dal tuo wallet quando vuoi prolungare.`,
    descriptionExtend: marketName =>
      `Le impostazioni degli avvisi salvate ${itForMarket(marketName, "market")} sono ancora nel tuo account. Paga di nuovo per prolungare l'accesso e modificarle.`,
  },
};
