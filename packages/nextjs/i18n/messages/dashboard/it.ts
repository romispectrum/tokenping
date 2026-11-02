import type { DashboardMessages } from "./shared";
import { itForMarket, itOnMarket, itTo, plural } from "~~/i18n/format";

/** "30 giorni", "1 giorno". */
const itDays = (days: number) =>
  plural("it", days, { one: `${days} giorno`, many: `${days} di giorni`, other: `${days} giorni` });

export const MESSAGES: DashboardMessages = {
  page: {
    metaTitle: "Posizioni Aave V3 e V4 e fattore di salute",
    metaDescription: (networkCount, channels) =>
      `Collaterale, debito e fattore di salute su Aave V3 e V4 su ${networkCount} reti, poi avvisi via ${channels}, una soglia per mercato.`,
    title: "Posizioni Aave V3 e V4 e avvisi sul fattore di salute",
    networkMarkets: (name, markets) => `${name} (mercati ${markets})`,
    intro: (v3Networks, v4Networks) =>
      `Collega il wallet con cui prendi in prestito per vedere collaterale, debito e fattore di salute su Aave V3 su ${v3Networks}, e in ogni Spoke di Aave V4 su ${v4Networks}. Per vedere non serve nessuna transazione.`,
    disclosureSummary: "Quanto costano gli avvisi e ogni quanto controlliamo",
    alertsCost: (channels, paymentChain) =>
      `Per ricevere un messaggio via ${channels} quando il fattore di salute di un mercato scende sotto una soglia che scegli tu, sblocca gli avvisi con un pagamento in USDC${paymentChain ? ` su ${paymentChain}` : ""}. Il prezzo attuale viene mostrato prima che tu paghi.`,
    checks: minutes =>
      `Tokenping controlla ${plural("it", minutes, { one: "ogni minuto", many: `ogni ${minutes} minuti`, other: `ogni ${minutes} minuti` })}. Finché il fattore di salute resta sotto la tua soglia, ogni controllo invia un nuovo messaggio su ogni canale che hai scelto.`,
    guideThreshold: "Come scegliere una soglia",
    guideAlerts: "Come funzionano gli avvisi",
    morphoDashboard: "Prendi in prestito su Morpho? Apri la dashboard Morpho",
  },
  gate: {
    title: "Collega un wallet per continuare",
    description:
      "Tokenping ha bisogno dell'indirizzo del tuo wallet per mostrarti le tue posizioni Aave. Collegarlo non sposta fondi e non costa commissioni.",
    connect: "Collega wallet",
    connecting: "Collegamento in corso",
    approveInWallet: "Approva il collegamento nel tuo wallet.",
  },
  positionsHeading: "Le tue posizioni Aave",
  loadingDashboard: "Caricamento della dashboard",
  toolbar: {
    wallet: "Wallet",
    refresh: "Aggiorna posizioni",
    refreshing: "Aggiornamento",
    loadingPositions: "Caricamento delle posizioni",
  },
  errors: {
    positionsDidNotLoad: "Impossibile caricare le posizioni",
    refreshFailed: "Aggiornamento non riuscito",
    showingLastPositions: "Mostriamo le posizioni dell'ultimo caricamento riuscito.",
    tryAgain: "Riprova",
    fetchPositionsFailed: "Impossibile recuperare le posizioni Aave",
  },
  totals: {
    supplied: "Totale depositato",
    borrowed: "Totale in prestito",
    netWorth: "Patrimonio netto",
    noData: "Nessun dato",
  },
  networks: {
    heading: "Mercati",
    active: count => plural("it", count, { one: `${count} attivo`, many: `${count} attivi`, other: `${count} attivi` }),
    noPositions: "Nessuna posizione Aave attiva trovata nei mercati supportati.",
    selectedRegion: "Mercato selezionato",
    noneSelectedTitle: "Nessun mercato selezionato",
    noneSelectedDescription: "Seleziona un mercato per vedere la tua posizione Aave.",
    otherMarkets: count => `Altri mercati (${count})`,
    otherMarketsHint: "Mercati controllati da Tokenping in cui questo wallet non ha né una posizione né un avviso.",
    alertSet: "Avviso impostato",
    supplied: usd => `${usd} depositati,`,
    borrowed: usd => `${usd} in prestito`,
    noPosition: "Nessuna posizione",
  },
  healthFactor: {
    srPrefix: "Fattore di salute ",
    noDebt: "Nessun debito",
    critical: "Critico",
    risky: "A rischio",
    safe: "Sicuro",
  },
  position: {
    market: version => (version === 4 ? "Spoke di Aave V4" : "Mercato di Aave V3"),
    noPositionTitle: chainName => `Nessuna posizione attiva ${itOnMarket(chainName)}`,
    noPositionDetail: chainName =>
      `Aave non indica né collaterale né debito per questo wallet ${itOnMarket(chainName)}.`,
    collateral: "Collaterale",
    debt: "Debito",
    netWorth: "Patrimonio netto",
    suppliedTitle: "Depositato",
    borrowedTitle: "In prestito",
    noCollateral: "Nessun collaterale depositato",
    noDebt: "Nessun debito in sospeso",
    tokenIconsFrom: "Icone di token e reti da",
    tokenDetailsFailedTitle: "Impossibile caricare i dettagli dei token",
    tokenDetailsFailedBody:
      "I totali qui sopra vengono dal riepilogo dell'account di Aave. Aggiorna le posizioni per riprovare.",
  },
  tokens: {
    asset: "Asset",
    supplied: "Depositato",
    supplyApy: "APY di deposito",
    collateral: "Collaterale",
    borrowed: "In prestito",
    rateType: "Tipo di tasso",
    enabled: "Attivo",
    disabled: "Disattivato",
    stable: amount => `Stabile ${amount}`,
    variable: amount => `Variabile ${amount}`,
    count: count => plural("it", count, { one: `${count} asset`, many: `${count} di asset`, other: `${count} asset` }),
  },
  address: {
    defaultLabel: "Indirizzo",
    copy: (_label, address) => `Copia l'indirizzo ${address}`,
    copied: "Indirizzo copiato",
    copyFailed: "Copia non riuscita. Seleziona l'indirizzo e copialo a mano.",
  },
  opensInNewTab: "(si apre in una nuova scheda)",
  paywall: {
    unlockedUntil: date => `Avvisi sbloccati fino al ${date}`,
    titleNew: "Sblocca gli avvisi sul fattore di salute",
    titleExtend: "Prolunga l'accesso per modificare i tuoi avvisi",
    descriptionNew:
      "Paga una volta per sbloccare le impostazioni degli avvisi e impostare una soglia del fattore di salute per ogni rete. Niente si rinnova in automatico: paghi dal tuo wallet quando vuoi prolungare.",
    descriptionExtend:
      "Le tue impostazioni degli avvisi precedenti sono salvate. Paga di nuovo per prolungare l'accesso e modificarle.",
    networkDescriptionNew: chainName =>
      `Paga una volta per impostare avvisi sul fattore di salute ${itOnMarket(chainName)} e su altri mercati. Niente si rinnova in automatico: paghi dal tuo wallet quando vuoi prolungare.`,
    networkDescriptionExtend: chainName =>
      `Le impostazioni degli avvisi salvate ${itForMarket(chainName)} sono ancora nel tuo account. Paga di nuovo per prolungare l'accesso e modificarle.`,
    connectWallet: "Collega il tuo wallet per pagare l'accesso.",
    unconfigured: "Nessun contratto di pagamento configurato per questa rete.",
    noPlan: "Al momento non è disponibile nessun piano a pagamento.",
    paused: "I pagamenti sono sospesi in questo momento. Riprova più tardi.",
    statusUnavailable: "Impossibile caricare lo stato del pagamento. Ricarica la pagina per riprovare.",
    wrongNetworkTitle: "Rete errata",
    wrongNetworkBody: (walletChain, target) =>
      `Il tuo wallet è ${walletChain ? `su ${walletChain}` : "su un'altra rete"}. Passa ${target ? `a ${target}` : "alla rete di pagamento"} per pagare.`,
    switchTo: target => (target ? `Passa ${itTo(target)}` : "Passa alla rete di pagamento"),
    switching: "Cambio di rete in corso",
    loadingDetails: "Caricamento dei dettagli del pagamento",
    price: "Prezzo",
    access: "Accesso",
    network: "Rete",
    networkFee: "Commissione di rete",
    networkFeeValue: symbol => `Pagata in ${symbol} a ogni passaggio, indicata nel tuo wallet`,
    period: (days, about) => (about ? `Circa ${itDays(days)}` : itDays(days)),
    pay: amount => `Paga ${amount}`,
    extend: (days, amount) => `Aggiungi ${itDays(days)} per ${amount}`,
    extendHint: days =>
      `Ogni pagamento aggiunge ${itDays(days)} dopo la tua data di scadenza attuale. Paga tutte le volte che vuoi; niente si rinnova da solo.`,
    accessExtended: date => `Accesso prolungato fino al ${date}.`,
    accessActive: "Accesso attivo. Ora puoi configurare gli avvisi.",
    paymentPending: "Pagamento confermato. L'accesso comparirà a breve.",
    loading: {
      processing: "Elaborazione in corso",
      waitingForWallet: "In attesa del tuo wallet",
      approving: "Approvazione in corso",
      paying: "Pagamento in corso",
    },
    unavailable: "L'accesso a pagamento non è disponibile in questo momento.",
    checkFailed: "Impossibile verificare lo stato del pagamento. Riprova tra un momento.",
    approvalNotVisible: "L'approvazione è confermata ma non ancora visibile. Riprova tra un momento.",
  },
  payment: {
    stepsLabel: "Passaggi del pagamento",
    approveTitle: amount => `Approva ${amount}`,
    approveHint:
      "Consente al contratto di pagamento di prelevare esattamente questo importo. Saltato se un'approvazione precedente lo copre già.",
    payTitle: amount => `Paga ${amount}`,
    payHint: "Invia il pagamento e sblocca gli avvisi.",
    inProgress: "In corso",
    done: "Fatto",
    notNeeded: "Non necessario",
    transaction: "Transazione ",
    viewOn: explorer => `Apri su ${explorer}`,
    preparingTitle: "Preparazione del pagamento",
    preparingBody: "Verifica del prezzo attuale e della tua approvazione.",
    confirmTitle: "Conferma nel tuo wallet",
    approveSignBody: amount => `Passaggio 1 di 2: approva ${amount}. Non viene inviato nulla finché non confermi.`,
    processingOn: network => (network ? `Elaborazione su ${network}` : "Elaborazione sulla rete"),
    approvePendingBody:
      "Passaggio 1 di 2: approvazione inviata. Subito dopo il tuo wallet ti chiede di confermare il pagamento.",
    paySignBody: amount => `Passaggio 2 di 2: paga ${amount}. Non viene inviato nulla finché non confermi.`,
    payPendingBody: "Passaggio 2 di 2: pagamento inviato. Gli avvisi si sbloccano appena la rete lo conferma.",
  },
};
