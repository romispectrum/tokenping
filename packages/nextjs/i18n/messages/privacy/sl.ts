import type { PrivacyMessages } from "./shared";

const ATTRIBUTION_QUESTION_SL = "„Od kod poznaš Tokenping?“";

export const MESSAGES: PrivacyMessages = {
  metaTitle: "Zasebnost in podatki",
  metaDescription:
    "Kaj Tokenping shrani, ko nastaviš opozorilo za health factor v Aave, česa ne shrani, katere storitve obdelujejo tvoje podatke in kako jih izbrišeš.",
  crumbHome: "Domov",
  crumbPrivacy: "Zasebnost",
  title: "Zasebnost: kaj Tokenping shrani in kdo to obdeluje",
  lastUpdated: "Zadnja posodobitev",
  intro:
    "Ta stran opisuje, kaj aplikacija počne danes. Tokenping je v različici beta in to stran posodobimo, ko se spremeni, kaj zbiramo.",
  withoutUs: {
    title: "Kaj lahko počneš brez posredovanja podatkov",
    text: "Branje spletnega mesta in bloga ter ogled tvojih pozicij na nadzorni plošči v našo bazo podatkov ne dodata ničesar. Da prikaže tvoje pozicije, tvoj brskalnik ponudnike RPC (navedene spodaj) vpraša za podatke Aave tvoje denarnice, zato ti vidijo naslov tvoje denarnice.",
    morpho:
      "Na nadzorni plošči Morpho tvoj brskalnik naslov tvoje denarnice pošlje tudi v API Morpho, ki poišče trge Morpho, na katerih si izposojaš, tvoje pozicije v Morpho pa bere pri istih ponudnikih RPC.",
  },
  stored: {
    title: "Kaj shranimo, ko shraniš opozorilo",
    items: [
      "Naslov tvoje denarnice.",
      "Omrežje, za katero je opozorilo, in tvoj prag.",
      "Izbrane kanale in jezik vsakega od njih.",
      "Tvoj e-poštni naslov, če izbereš e-pošto.",
      "Tvoje uporabniško ime Signal, če izbereš Signal.",
      "Kdaj je bilo opozorilo ustvarjeno in kdaj nazadnje spremenjeno.",
      "Čas zadnjega testnega sporočila prek posameznega kanala, da omogočimo en test na kanal vsakih 15 minut.",
    ],
    telegram:
      "Če izbereš Telegram, shranimo uporabniško ime Telegram, ki ga vneseš v opozorilo. Ko ta račun pri botu Tokenping pritisne Start, shranimo tudi njegov ID klepeta in čas, ko je pritisnil Start, da ga opozorila lahko dosežejo. Kdorkoli lahko preveri, ali je neko uporabniško ime Telegram pri botu pritisnilo Start.",
    attribution: `Če po shranjevanju opozorila odgovoriš na neobvezno vprašanje ${ATTRIBUTION_QUESTION_SL}, shranimo tvoj odgovor in čas skupaj z naslovom tvoje denarnice.`,
  },
  notStored: {
    title: "Česa ne shranimo",
    items: [
      "Tvojih pozicij ali zgodovine tvojega health factorja. Berejo se sproti in se ne shranjujejo.",
      "Dnevnika poslanih opozoril.",
      `Sledilnih pikslov ali oglaševalskih piškotkov: spletno mesto jih ne uporablja. Ko se prijaviš z denarnico, Tokenping nastavi en piškotek, ki pove samo, katera denarnica se je prijavila; velja 7 dni ali dokler na tem spletnem mestu ne prekineš povezave z denarnico. Med prijavo drugi piškotek pet minut hrani zahtevo za prijavo. Tvoj brskalnik v svoji lokalni shrambi hrani izbrano temo, povezavo z denarnico, katere denarnice so se v njem prijavile in ali ti je že pokazal vprašanje ${ATTRIBUTION_QUESTION_SL}.`,
      "Naslovov IP v naši bazi podatkov. Vercel kljub temu obdela vsako zahtevo, kot je navedeno spodaj. Ko preverjanje opozorila ali sporočilo ne uspe, gre napaka, ki lahko vsebuje naslov tvoje denarnice in prejemnika, v dnevnike našega strežnika.",
    ],
  },
  whoCanSee: {
    title: "Kdo lahko vidi tvoje nastavitve opozoril",
    tiedToWallet:
      "Nastavitve opozoril so vezane na naslov denarnice, ne na račun z geslom. Da jih vidiš ali spremeniš, s to denarnico podpišeš sporočilo, ki dokazuje, da je naslov tvoj. To ni transakcija in ne stane gasa, en podpis pa v tem brskalniku velja 7 dni.",
    anyone: hasTelegram =>
      `Samo nekdo, ki lahko podpisuje s tvojo denarnico, lahko vidi e-poštni naslov${hasTelegram ? ", uporabniško ime Signal in uporabniško ime Telegram" : " in uporabniško ime Signal"}, shranjene zanjo, ali spremeni ali izbriše njena opozorila. Javni zapisi plačil, opisani spodaj, kljub temu kažejo, katere denarnice so plačale.`,
    dontEnter:
      "Ne vnašaj e-poštnega naslova ali uporabniškega imena Signal, za katerega ne želiš, da je povezan z naslovom tvoje denarnice.",
  },
  processors: {
    title: "Kdo obdeluje tvoje podatke",
    list: ({ minutes, hasTelegram }) => [
      {
        name: "Vercel",
        role: `Gosti to spletno mesto in vsakih ${minutes} minut zažene preverjanje opozoril.`,
        receives: "Vsako zahtevo na spletno mesto, vključno s tvojim naslovom IP, in dnevnike našega strežnika.",
      },
      {
        name: "Vercel Web Analytics",
        role: "Šteje oglede strani, brez piškotkov.",
        receives:
          "Za vsak ogled strani: naslov strani, spletno mesto, s katerega prihajaš, tvojo približno lokacijo ter tvoj brskalnik, operacijski sistem in vrsto naprave. Obiskovalec je zgoščena vrednost (hash) zahteve, ki se spremeni vsakih 24 ur, zato obiskov ni mogoče povezati med dnevi ali spletnimi mesti.",
      },
      { name: "Supabase", role: "Naša baza podatkov.", receives: "Zgoraj navedene nastavitve opozoril." },
      {
        name: "Resend",
        role: "Pošilja opozorila po e-pošti.",
        receives: "Tvoj e-poštni naslov in besedilo opozorila.",
      },
      {
        name: "Fly.io (naš rele za Signal)",
        role: "Gosti strežnik signal-cli-rest-api, ki ga upravljamo in ki opozorila za Signal preda storitvi Signal.",
        receives: "Tvoje uporabniško ime Signal in besedilo opozorila (enako tudi Signal).",
      },
      ...(hasTelegram
        ? [
            {
              name: "Telegram",
              role: "Dostavlja opozorila za Telegram prek svojega vmesnika Bot API.",
              receives: "ID tvojega klepeta Telegram in besedilo opozorila.",
            },
          ]
        : []),
      {
        name: "Ponudniki RPC (PublicNode, Alchemy in javne končne točke omrežij)",
        role: "Odgovarjajo na branja verige: iz tvojega brskalnika za nadzorno ploščo in iz našega strežnika za preverjanje opozoril in za preverjanje podpisov ob prijavi s pametnimi denarnicami.",
        receives:
          "Naslov denarnice, ki se bere (in ob prijavi tvoj podpis), ter tvoj naslov IP pri branjih iz tvojega brskalnika.",
      },
      {
        name: "API Morpho",
        role: "Za nadzorno ploščo Morpho poišče navedene trge Morpho, na katerih si tvoja denarnica izposoja, našemu strežniku pa pove, ali je trg naveden, ko shraniš opozorilo za Morpho.",
        receives: "Naslov tvoje denarnice ter tvoj naslov IP pri poizvedbah iz tvojega brskalnika.",
      },
      {
        name: "WalletConnect",
        role: "Posreduje povezavo med tem spletnim mestom in aplikacijo tvoje denarnice, če se povežeš prek WalletConnect.",
        receives:
          "Kar si aplikacija tvoje denarnice in to spletno mesto izmenjata za povezavo, na primer naslov tvoje denarnice.",
      },
    ],
    receives: receives => `Prejme: ${receives}`,
    ownPolicy: "Vsaka od teh storitev obdeluje te podatke v skladu s svojim pravilnikom o zasebnosti.",
  },
  onChain: {
    title: "Kaj je javno na verigi blokov",
    text: paymentChainName =>
      `Plačilo za opozorila poteka ${paymentChainName ? `na omrežju ${paymentChainName}` : "na plačilnem omrežju"}. Vsako plačilo zapiše naslov plačnika, žeton, znesek, čas, kupljeno obdobje in novi datum poteka v javni dogodek, ki ga lahko prebere vsakdo in ga nihče ne more izbrisati. Tvoje nastavitve opozoril se nikoli ne zapišejo na verigo blokov.`,
  },
  retention: {
    title: "Kako dolgo jih hranimo in kako jih izbrišeš",
    settings:
      "Nastavitve opozoril ostanejo, dokler opozorila ne izbrišeš na nadzorni plošči. Brisanje odstrani nastavitve za to omrežje, vključno z e-poštnim naslovom in uporabniškim imenom Signal, in zahteva aktiven dostop.",
    telegramStop:
      "Če botu Tokenping v aplikaciji Telegram pošlješ /stop, se tvoj klepet odklopi in opozorila za Telegram se ustavijo.",
    contact: {
      before: `Če je tvoj dostop potekel ali želiš, da odstranimo tvoj odgovor na vprašanje ${ATTRIBUTION_QUESTION_SL}, nam piši na`,
      x: "X",
      middle: "ali v naši skupnosti v aplikaciji",
      telegram: "Telegram",
      or: "ali",
      signal: "Signal",
      after: "in ga bomo izbrisali.",
    },
    payments: "Plačil na verigi blokov ne more izbrisati nihče.",
  },
  homepage: {
    before: "Odgovori na vprašanja o tem, kako delujejo opozorila, so na ",
    link: "domači strani",
    after: ".",
  },
};
