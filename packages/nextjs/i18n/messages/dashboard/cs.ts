import type { DashboardMessages } from "./shared";
import { capitalize, csForMarket, csOnMarket, plural } from "~~/i18n/format";

export const MESSAGES: DashboardMessages = {
  page: {
    metaTitle: "Pozice na Aave V3 a V4 a health factor",
    metaDescription: (networkCount, channels) =>
      `Uvidíte kolaterál, dluh a health factor na Aave V3 a V4 na ${networkCount} sítích. Pak si nastavte upozornění přes ${channels}, jeden práh na trh.`,
    title: "Pozice na Aave V3 a V4 a upozornění na health factor",
    networkMarkets: (name, markets) => `${name} (trhy ${markets})`,
    intro: (v3Networks, v4Networks) =>
      `Připojte peněženku, se kterou si půjčujete, a uvidíte její kolaterál, dluh a health factor na Aave V3 na sítích ${v3Networks} a ve všech trzích (Spoke) Aave V4 na sítích ${v4Networks}. Prohlížení nevyžaduje žádnou transakci.`,
    disclosureSummary: "Kolik upozornění stojí a jak často kontrolujeme",
    alertsCost: (channels, paymentChain) =>
      `Pokud chcete dostat zprávu přes ${channels}, když health factor na některém trhu klesne pod zvolený práh, odemkněte upozornění platbou v USDC${paymentChain ? ` na síti ${paymentChain}` : ""}. Aktuální cenu uvidíte před zaplacením.`,
    checks: (minutes, repeatMinutes) =>
      `Tokenping kontroluje ${plural("cs", minutes, { one: "každou minutu", few: `každé ${minutes} minuty`, other: `každých ${minutes} minut` })}. Dokud health factor zůstává pod vaším prahem, dostanete každých ${repeatMinutes} minut zprávu do každého kanálu, který jste zvolili.`,
    guideThreshold: "Jak zvolit práh",
    guideAlerts: "Jak fungují upozornění",
    morphoDashboard: "Půjčujete si na Morpho? Otevřete přehled Morpho",
  },
  gate: {
    title: "Pro pokračování připojte peněženku",
    description:
      "Tokenping potřebuje adresu vaší peněženky, aby mohl zobrazit vaše pozice na Aave. Připojení nepřesouvá žádné prostředky a nic nestojí.",
    connect: "Připojit peněženku",
    connecting: "Připojování",
    approveInWallet: "Potvrďte připojení v peněžence.",
  },
  positionsHeading: "Vaše pozice na Aave",
  loadingDashboard: "Načítání přehledu",
  toolbar: {
    wallet: "Peněženka",
    refresh: "Obnovit pozice",
    refreshing: "Obnovování",
    loadingPositions: "Načítání pozic",
  },
  errors: {
    positionsDidNotLoad: "Pozice se nenačetly",
    refreshFailed: "Obnovení se nezdařilo",
    showingLastPositions: "Zobrazujeme pozice z posledního úspěšného načtení.",
    tryAgain: "Zkusit znovu",
    fetchPositionsFailed: "Pozice na Aave se nepodařilo načíst",
  },
  totals: {
    supplied: "Celkem vloženo",
    borrowed: "Celkem vypůjčeno",
    netWorth: "Čisté jmění",
    noData: "Žádná data",
  },
  networks: {
    heading: "Trhy",
    active: count =>
      plural("cs", count, { one: `${count} aktivní`, few: `${count} aktivní`, other: `${count} aktivních` }),
    noPositions: "Na podporovaných trzích jsme nenašli žádné aktivní pozice na Aave.",
    selectedRegion: "Vybraný trh",
    noneSelectedTitle: "Není vybraný žádný trh",
    noneSelectedDescription: "Vyberte trh a zobrazí se jeho pozice na Aave.",
    otherMarkets: count => `Další trhy (${count})`,
    otherMarketsHint: "Trhy, které Tokenping zkontroloval a kde tato peněženka nemá pozici ani upozornění.",
    alertSet: "Upozornění nastaveno",
    supplied: usd => `vloženo ${usd},`,
    borrowed: usd => `vypůjčeno ${usd}`,
    noPosition: "Bez pozice",
  },
  healthFactor: {
    srPrefix: "Health factor ",
    noDebt: "Bez dluhu",
    critical: "Kritický",
    risky: "Rizikový",
    safe: "Bezpečný",
  },
  position: {
    market: version => (version === 4 ? "Spoke Aave V4" : "Trh Aave V3"),
    noPositionTitle: chainName => `${capitalize(csOnMarket(chainName))} nemáte žádnou aktivní pozici`,
    noPositionDetail: chainName => `Aave pro tuto peněženku ${csOnMarket(chainName)} neuvádí žádný kolaterál ani dluh.`,
    collateral: "Kolaterál",
    debt: "Dluh",
    netWorth: "Čisté jmění",
    suppliedTitle: "Vloženo",
    borrowedTitle: "Vypůjčeno",
    noCollateral: "Žádný vložený kolaterál",
    noDebt: "Žádný nesplacený dluh",
    tokenIconsFrom: "Ikony tokenů a sítí z",
    tokenDetailsFailedTitle: "Podrobnosti o tokenech se nenačetly",
    tokenDetailsFailedBody: "Součty výše pocházejí ze souhrnu účtu na Aave. Pro nový pokus obnovte pozice.",
  },
  tokens: {
    asset: "Aktivum",
    supplied: "Vloženo",
    supplyApy: "APY vkladu",
    collateral: "Kolaterál",
    borrowed: "Vypůjčeno",
    rateType: "Typ sazby",
    enabled: "Zapnuto",
    disabled: "Vypnuto",
    stable: amount => `Stabilní ${amount}`,
    variable: amount => `Variabilní ${amount}`,
    count: count => plural("cs", count, { one: `${count} aktivum`, few: `${count} aktiva`, other: `${count} aktiv` }),
  },
  address: {
    defaultLabel: "Adresa",
    copy: (_label, address) => `Zkopírovat adresu ${address}`,
    copied: "Adresa zkopírována",
    copyFailed: "Nepodařilo se zkopírovat. Označte adresu a zkopírujte ji ručně.",
  },
  opensInNewTab: "(otevře se v nové záložce)",
  paywall: {
    unlockedUntil: date => `Upozornění odemčena do ${date}`,
    titleNew: "Odemkněte upozornění na health factor",
    titleExtend: "Prodlužte přístup a upravte svá upozornění",
    descriptionNew:
      "Zaplaťte jednou a odemkne se nastavení upozornění, kde si pro každou síť určíte práh health factoru. Nic se automaticky neobnovuje: když budete chtít přístup prodloužit, zaplatíte znovu ze své peněženky.",
    descriptionExtend:
      "Vaše dřívější nastavení upozornění zůstalo uložené. Zaplaťte znovu, tím prodloužíte přístup a nastavení můžete upravit.",
    networkDescriptionNew: chainName =>
      `Zaplaťte jednou a nastavte si upozornění na health factor ${csOnMarket(chainName)} i na dalších trzích. Nic se automaticky neobnovuje: když budete chtít přístup prodloužit, zaplatíte znovu ze své peněženky.`,
    networkDescriptionExtend: chainName =>
      `Vaše uložené nastavení upozornění ${csForMarket(chainName)} ve vašem účtu zůstává. Zaplaťte znovu, tím prodloužíte přístup a nastavení můžete upravit.`,
    connectWallet: "Připojte peněženku, abyste mohli za přístup zaplatit.",
    unconfigured: "Platební kontrakt pro tuto síť není nastavený.",
    noPlan: "Momentálně není k dispozici žádný placený tarif.",
    paused: "Platby jsou momentálně pozastavené. Zkuste to později.",
    statusUnavailable: "Stav platby se nepodařilo načíst. Pro nový pokus obnovte stránku.",
    wrongNetworkTitle: "Nesprávná síť",
    wrongNetworkBody: (walletChain, target) =>
      `${walletChain ? `Vaše peněženka je na síti ${walletChain}.` : "Vaše peněženka je na jiné síti."} Pro zaplacení přepněte na ${target ? `síť ${target}` : "platební síť"}.`,
    switchTo: target => `Přepnout na ${target ? `síť ${target}` : "platební síť"}`,
    switching: "Přepínání sítě",
    loadingDetails: "Načítání platebních údajů",
    price: "Cena",
    access: "Přístup",
    network: "Síť",
    networkFee: "Poplatek sítě",
    networkFeeValue: symbol => `Platí se v ${symbol} za každý krok, výši uvidíte v peněžence`,
    period: (days, about) => {
      const period = plural("cs", days, { one: `${days} den`, few: `${days} dny`, other: `${days} dní` });
      return about ? `Přibližně ${period}` : period;
    },
    pay: amount => `Zaplatit ${amount}`,
    extend: (days, amount) =>
      `Přidat ${plural("cs", days, { one: `${days} den`, few: `${days} dny`, other: `${days} dní` })} za ${amount}`,
    extendHint: days =>
      `Každá platba přidá ${plural("cs", days, { one: `${days} den`, few: `${days} dny`, other: `${days} dní` })} k datu, kdy vám přístup končí. Platit můžete, kolikrát chcete; nic se neobnovuje samo.`,
    accessExtended: date => `Přístup je prodloužený do ${date}.`,
    accessActive: "Přístup je aktivní. Teď si můžete nastavit upozornění.",
    paymentPending: "Platba je potvrzená. Přístup se brzy zobrazí.",
    loading: {
      processing: "Zpracování",
      waitingForWallet: "Čekáme na vaši peněženku",
      approving: "Schvalování",
      paying: "Placení",
    },
    unavailable: "Placený přístup teď není k dispozici.",
    checkFailed: "Stav platby se nepodařilo ověřit. Zkuste to za chvíli znovu.",
    approvalNotVisible: "Schválení je potvrzené, ale zatím se nezobrazuje. Zkuste to za chvíli znovu.",
  },
  payment: {
    stepsLabel: "Kroky platby",
    approveTitle: amount => `Schválit ${amount}`,
    approveHint:
      "Platební kontrakt si smí vzít přesně tuto částku. Krok se přeskočí, pokud ji pokrývá dřívější schválení.",
    payTitle: amount => `Zaplatit ${amount}`,
    payHint: "Odešle platbu a odemkne upozornění.",
    inProgress: "Probíhá",
    done: "Hotovo",
    notNeeded: "Není potřeba",
    transaction: "Transakce ",
    viewOn: explorer => `Zobrazit na ${explorer}`,
    preparingTitle: "Připravujeme platbu",
    preparingBody: "Ověřujeme aktuální cenu a vaše schválení.",
    confirmTitle: "Potvrďte v peněžence",
    approveSignBody: amount => `Krok 1 ze 2: schválení ${amount}. Dokud nepotvrdíte, nic se neodešle.`,
    processingOn: network => (network ? `Zpracování na síti ${network}` : "Zpracování v síti"),
    approvePendingBody: "Krok 1 ze 2: schválení odesláno. Peněženka vás pak požádá o potvrzení platby.",
    paySignBody: amount => `Krok 2 ze 2: platba ${amount}. Dokud nepotvrdíte, nic se neodešle.`,
    payPendingBody: "Krok 2 ze 2: platba odeslána. Upozornění se odemknou, jakmile ji síť potvrdí.",
  },
};
