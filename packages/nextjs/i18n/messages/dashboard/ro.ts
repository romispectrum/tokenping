import type { DashboardMessages } from "./shared";
import { plural, roForMarket, roOnMarket } from "~~/i18n/format";

const roDays = (days: number) =>
  plural("ro", days, { one: `${days} zi`, few: `${days} zile`, other: `${days} de zile` });

const roNetworks = (count: number) =>
  plural("ro", count, { one: `${count} rețea`, few: `${count} rețele`, other: `${count} de rețele` });

export const MESSAGES: DashboardMessages = {
  page: {
    metaTitle: "Aave V3 și V4: poziții și health factor",
    metaDescription: (networkCount, channels) =>
      `Vezi garanția, datoria și health factor-ul pe Aave V3 și V4 pe ${roNetworks(networkCount)}. Alerte prin ${channels}, un prag pentru fiecare piață.`,
    title: "Aave V3 și V4: poziții și alerte de health factor",
    networkMarkets: (name, markets) => `${name} (piețele ${markets})`,
    intro: (v3Networks, v4Networks) =>
      `Conectează portofelul cu care te împrumuți ca să vezi garanția, datoria și health factor-ul pe Aave V3 pe ${v3Networks} și în fiecare Spoke Aave V4 pe ${v4Networks}. Vizualizarea nu necesită nicio tranzacție.`,
    disclosureSummary: "Cât costă alertele și cât de des verificăm",
    alertsCost: (channels, paymentChain) =>
      `Ca să primești un mesaj prin ${channels} când health factor-ul unei piețe scade sub un prag ales de tine, deblochează alertele cu o plată în USDC${paymentChain ? ` pe ${paymentChain}` : ""}. Prețul actual este afișat înainte să plătești.`,
    checks: minutes =>
      `Tokenping verifică ${plural("ro", minutes, {
        one: "în fiecare minut",
        few: `la fiecare ${minutes} minute`,
        other: `la fiecare ${minutes} de minute`,
      })}. Cât timp health factor-ul rămâne sub pragul tău, fiecare verificare trimite încă un mesaj pe fiecare canal ales.`,
    guideThreshold: "Cum alegi un prag",
    guideAlerts: "Cum funcționează alertele",
    morphoDashboard: "Te împrumuți pe Morpho? Deschide panoul Morpho",
  },
  gate: {
    title: "Conectează un portofel ca să continui",
    description:
      "Tokenping are nevoie de adresa portofelului tău ca să-ți arate pozițiile Aave. Conectarea nu mută fonduri și nu costă nimic.",
    connect: "Conectează portofelul",
    connecting: "Se conectează",
    approveInWallet: "Aprobă conectarea în portofel.",
  },
  positionsHeading: "Pozițiile tale Aave",
  loadingDashboard: "Se încarcă panoul",
  toolbar: {
    wallet: "Portofel",
    refresh: "Reîmprospătează pozițiile",
    refreshing: "Se reîmprospătează",
    loadingPositions: "Se încarcă pozițiile",
  },
  errors: {
    positionsDidNotLoad: "Pozițiile nu s-au încărcat",
    refreshFailed: "Reîmprospătarea nu a reușit",
    showingLastPositions: "Vezi pozițiile de la ultima încărcare reușită.",
    tryAgain: "Încearcă din nou",
    fetchPositionsFailed: "Pozițiile Aave nu au putut fi încărcate",
  },
  totals: {
    supplied: "Total depus",
    borrowed: "Total împrumutat",
    netWorth: "Valoare netă",
    noData: "Fără date",
  },
  networks: {
    heading: "Piețe",
    active: count =>
      plural("ro", count, { one: `${count} activă`, few: `${count} active`, other: `${count} de active` }),
    noPositions: "Nu am găsit poziții Aave active în piețele acceptate.",
    selectedRegion: "Piața aleasă",
    noneSelectedTitle: "Nicio piață aleasă",
    noneSelectedDescription: "Alege o piață ca să vezi poziția Aave.",
    otherMarkets: count => `Alte piețe (${count})`,
    otherMarketsHint: "Piețe verificate de Tokenping în care acest portofel nu are nici poziție, nici alertă.",
    alertSet: "Alertă setată",
    supplied: usd => `${usd} depus,`,
    borrowed: usd => `${usd} împrumutat`,
    noPosition: "Nicio poziție",
  },
  healthFactor: {
    srPrefix: "Health factor ",
    noDebt: "Fără datorie",
    critical: "Critic",
    risky: "Riscant",
    safe: "Sigur",
  },
  position: {
    market: version => (version === 4 ? "Spoke Aave V4" : "Piață Aave V3"),
    noPositionTitle: chainName => `Nicio poziție activă ${roOnMarket(chainName)}`,
    noPositionDetail: chainName =>
      `Aave nu raportează nicio garanție și nicio datorie pentru acest portofel ${roOnMarket(chainName)}.`,
    collateral: "Garanție",
    debt: "Datorie",
    netWorth: "Valoare netă",
    suppliedTitle: "Depus",
    borrowedTitle: "Împrumutat",
    noCollateral: "Nicio garanție depusă",
    noDebt: "Nicio datorie restantă",
    tokenIconsFrom: "Pictograme de tokenuri și rețele de la",
    tokenDetailsFailedTitle: "Detaliile tokenurilor nu s-au încărcat",
    tokenDetailsFailedBody:
      "Totalurile de mai sus provin din rezumatul contului Aave. Reîmprospătează pozițiile ca să încerci din nou.",
  },
  tokens: {
    asset: "Activ",
    supplied: "Depus",
    supplyApy: "APY la depunere",
    collateral: "Ca garanție",
    borrowed: "Împrumutat",
    rateType: "Tip de dobândă",
    enabled: "Activată",
    disabled: "Dezactivată",
    stable: amount => `Stabilă ${amount}`,
    variable: amount => `Variabilă ${amount}`,
    count: count => plural("ro", count, { one: `${count} activ`, few: `${count} active`, other: `${count} de active` }),
  },
  address: {
    defaultLabel: "Adresă",
    copy: (_label, address) => `Copiază adresa ${address}`,
    copied: "Adresă copiată",
    copyFailed: "Copierea nu a reușit. Selectează adresa și copiaz-o manual.",
  },
  opensInNewTab: "(se deschide într-o filă nouă)",
  paywall: {
    unlockedUntil: date => `Alerte deblocate până la ${date}`,
    titleNew: "Deblochează alertele de health factor",
    titleExtend: "Prelungește accesul ca să-ți editezi alertele",
    descriptionNew:
      "Plătești o singură dată ca să deblochezi setările alertei și să setezi un prag de health factor pentru fiecare rețea. Nimic nu se reînnoiește automat: plătești din portofel când vrei să prelungești.",
    descriptionExtend:
      "Setările tale anterioare ale alertei sunt salvate. Plătește din nou ca să prelungești accesul și să le editezi.",
    networkDescriptionNew: chainName =>
      `Plătești o singură dată ca să setezi alerte de health factor ${roOnMarket(chainName)} și pe alte piețe. Nimic nu se reînnoiește automat: plătești din portofel când vrei să prelungești.`,
    networkDescriptionExtend: chainName =>
      `Setările alertei salvate ${roForMarket(chainName)} sunt încă în contul tău. Plătește din nou ca să prelungești accesul și să le editezi.`,
    connectWallet: "Conectează portofelul ca să plătești accesul.",
    unconfigured: "Contractul de plată nu este configurat pentru această rețea.",
    noPlan: "Momentan nu este disponibil niciun plan plătit.",
    paused: "Plățile sunt suspendate acum. Încearcă din nou mai târziu.",
    statusUnavailable: "Starea plății nu a putut fi încărcată. Reîncarcă pagina ca să încerci din nou.",
    wrongNetworkTitle: "Rețea greșită",
    wrongNetworkBody: (walletChain, target) =>
      `Portofelul tău este pe ${walletChain ?? "altă rețea"}. Treci la ${target ?? "rețeaua de plată"} ca să plătești.`,
    switchTo: target => `Treci la ${target ?? "rețeaua de plată"}`,
    switching: "Se schimbă rețeaua",
    loadingDetails: "Se încarcă detaliile plății",
    price: "Preț",
    access: "Acces",
    network: "Rețea",
    networkFee: "Taxa de rețea",
    networkFeeValue: symbol => `Plătită în ${symbol} pentru fiecare pas, afișată în portofel`,
    period: (days, about) => (about ? `Aproximativ ${roDays(days)}` : roDays(days)),
    pay: amount => `Plătește ${amount}`,
    extend: (days, amount) => `Adaugă ${roDays(days)} pentru ${amount}`,
    extendHint: days =>
      `Fiecare plată adaugă ${roDays(days)} după data actuală de încheiere. Plătește de câte ori vrei; nimic nu se reînnoiește singur.`,
    accessExtended: date => `Acces prelungit până la ${date}.`,
    accessActive: "Acces activ. Acum îți poți configura alertele.",
    paymentPending: "Plată confirmată. Accesul va apărea în scurt timp.",
    loading: {
      processing: "Se procesează",
      waitingForWallet: "Se așteaptă portofelul",
      approving: "Se aprobă",
      paying: "Se plătește",
    },
    unavailable: "Accesul plătit nu este disponibil acum.",
    checkFailed: "Starea plății nu a putut fi verificată. Încearcă din nou peste câteva momente.",
    approvalNotVisible: "Aprobarea este confirmată, dar nu este vizibilă încă. Încearcă din nou peste câteva momente.",
  },
  payment: {
    stepsLabel: "Pașii plății",
    approveTitle: amount => `Aprobă ${amount}`,
    approveHint:
      "Permite contractului de plată să preia exact această sumă. Pasul este omis dacă o aprobare anterioară o acoperă deja.",
    payTitle: amount => `Plătește ${amount}`,
    payHint: "Trimite plata și deblochează alertele.",
    inProgress: "În curs",
    done: "Gata",
    notNeeded: "Nu este necesar",
    transaction: "Tranzacție ",
    viewOn: explorer => `Vezi pe ${explorer}`,
    preparingTitle: "Se pregătește plata",
    preparingBody: "Se verifică prețul actual și aprobarea ta.",
    confirmTitle: "Confirmă în portofel",
    approveSignBody: amount => `Pasul 1 din 2: aprobă ${amount}. Nu se trimite nimic până nu confirmi.`,
    processingOn: network => `Se procesează pe ${network ?? "rețea"}`,
    approvePendingBody: "Pasul 1 din 2: aprobare trimisă. Apoi portofelul îți cere să confirmi plata.",
    paySignBody: amount => `Pasul 2 din 2: plătește ${amount}. Nu se trimite nimic până nu confirmi.`,
    payPendingBody: "Pasul 2 din 2: plată trimisă. Alertele se deblochează după ce rețeaua o confirmă.",
  },
};
