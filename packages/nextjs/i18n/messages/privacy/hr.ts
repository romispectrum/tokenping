import type { PrivacyMessages } from "./shared";
import { hrOnMarket, plural } from "~~/i18n/format";

const ATTRIBUTION_QUESTION_HR = "„Odakle znaš za Tokenping?“";

/** "svakih 5 minuta", "svake 2 minute", "svake minute". */
const everyMinutes = (minutes: number) =>
  minutes === 1
    ? "svake minute"
    : plural("hr", minutes, {
        one: `svakih ${minutes} minuta`,
        few: `svake ${minutes} minute`,
        other: `svakih ${minutes} minuta`,
      });

export const MESSAGES: PrivacyMessages = {
  metaTitle: "Privatnost i podaci",
  metaDescription:
    "Što Tokenping sprema kad postaviš upozorenje za health factor na Aaveu, što ne sprema, koji servisi obrađuju tvoje podatke i kako ih izbrisati.",
  crumbHome: "Početna",
  crumbPrivacy: "Privatnost",
  title: "Privatnost: što Tokenping sprema i tko to obrađuje",
  lastUpdated: "Posljednje ažuriranje",
  intro:
    "Ova stranica opisuje što aplikacija radi danas. Tokenping je u beta verziji i ovu stranicu ažuriramo kad se promijeni ono što prikupljamo.",
  withoutUs: {
    title: "Što možeš raditi a da nam ništa ne daš",
    text: "Čitanje stranice i bloga te pregled tvojih pozicija na nadzornoj ploči ne dodaju ništa u našu bazu podataka. Da prikaže tvoje pozicije, tvoj preglednik od pružatelja RPC usluga (navedeni su niže) traži podatke tvog novčanika na Aaveu, pa oni vide adresu tvog novčanika.",
    morpho:
      "Na nadzornoj ploči za Morpho tvoj preglednik šalje adresu tvog novčanika i Morphovu API-ju, koji pronalazi tržišta na Morphu na kojima se zadužuješ, a tvoje pozicije na Morphu čita od istih pružatelja RPC usluga.",
  },
  stored: {
    title: "Što spremamo kad spremiš upozorenje",
    items: [
      "Adresu tvog novčanika.",
      "Mrežu na koju se upozorenje odnosi i tvoj prag.",
      "Odabrane kanale i jezik svakog od njih.",
      "Tvoju adresu e-pošte, ako je odabrana e-pošta.",
      "Tvoje korisničko ime na Signalu, ako je odabran Signal.",
      "Kad je upozorenje izrađeno i kad je zadnji put promijenjeno.",
      "Kad je zadnja testna poruka poslana na svakom kanalu, kako bi bio moguć jedan test po kanalu svakih 15 minuta.",
    ],
    telegram:
      "Ako odabereš Telegram, spremamo korisničko ime na Telegramu koje upišeš u upozorenje. Kad taj račun pritisne Start u Tokenping botu, spremamo i ID njegova razgovora te vrijeme kad je pritisnuo Start, kako bi upozorenja mogla stići do njega. Svatko može provjeriti je li neko korisničko ime na Telegramu pritisnulo Start u botu.",
    attribution: `Ako nakon spremanja upozorenja odgovoriš na neobavezno pitanje ${ATTRIBUTION_QUESTION_HR}, spremamo tvoj odgovor i vrijeme uz adresu tvog novčanika.`,
  },
  notStored: {
    title: "Što ne spremamo",
    items: [
      "Tvoje pozicije ni povijest tvog health factora. Čitaju se uživo i ne spremaju se.",
      "Zapis o poslanim upozorenjima.",
      `Piksele za praćenje ni reklamne kolačiće: stranica ne koristi nijedne. Kad se prijaviš novčanikom, Tokenping postavlja jedan kolačić koji govori samo koji se novčanik prijavio; vrijedi 7 dana ili dok ne odspojiš novčanik na ovoj stranici. Dok se prijavljuješ, drugi kolačić pet minuta čuva zahtjev za prijavu. Tvoj preglednik u vlastitoj lokalnoj pohrani čuva tvoj odabir teme, vezu s novčanikom, koji su se novčanici na njemu prijavili i je li ti već prikazao pitanje ${ATTRIBUTION_QUESTION_HR}.`,
      "IP adrese u našoj bazi podataka. Vercel ipak obrađuje svaki zahtjev, kako je navedeno niže. Kad provjera upozorenja ili slanje poruke ne uspije, pogreška, koja može sadržavati adresu tvog novčanika i primatelja, odlazi u zapise našeg poslužitelja.",
    ],
  },
  whoCanSee: {
    title: "Tko može vidjeti tvoje postavke upozorenja",
    tiedToWallet:
      "Postavke upozorenja vezane su uz adresu novčanika, a ne uz račun s lozinkom. Da ih vidiš ili promijeniš, potpisuješ poruku tim novčanikom, čime dokazuješ da je adresa tvoja. To nije transakcija i ne troši gas, a jedan potpis vrijedi 7 dana u tom pregledniku.",
    anyone: hasTelegram =>
      `Samo netko tko može potpisivati tvojim novčanikom može vidjeti adresu e-pošte${hasTelegram ? ", korisničko ime na Signalu i korisničko ime na Telegramu" : " i korisničko ime na Signalu"} spremljene za njega te promijeniti ili izbrisati njegova upozorenja. Javni zapisi o plaćanjima opisani niže ipak pokazuju koji su novčanici platili.`,
    dontEnter: "Ne unosi adresu e-pošte ni korisničko ime na Signalu koje ne želiš povezati s adresom svog novčanika.",
  },
  processors: {
    title: "Tko obrađuje tvoje podatke",
    list: ({ minutes, hasTelegram }) => [
      {
        name: "Vercel",
        role: `Hostira ovu stranicu i pokreće provjeru upozorenja ${everyMinutes(minutes)}.`,
        receives: "Svaki zahtjev prema stranici, uključujući tvoju IP adresu, i zapise našeg poslužitelja.",
      },
      {
        name: "Vercel Web Analytics",
        role: "Broji posjete stranicama, bez kolačića.",
        receives:
          "Za svaki posjet stranici: adresu stranice, stranicu s koje dolaziš, tvoju približnu lokaciju te tvoj preglednik, operacijski sustav i vrstu uređaja. Posjetitelj je hash zahtjeva koji se mijenja svaka 24 sata, pa se posjeti ne mogu povezati kroz dane ni između stranica.",
      },
      { name: "Supabase", role: "Naša baza podataka.", receives: "Gore navedene postavke upozorenja." },
      {
        name: "Resend",
        role: "Šalje upozorenja e-poštom.",
        receives: "Tvoju adresu e-pošte i tekst upozorenja.",
      },
      {
        name: "Fly.io (naš posrednik za Signal)",
        role: "Hostira poslužitelj signal-cli-rest-api koji pokrećemo i koji predaje upozorenja Signalu.",
        receives: "Tvoje korisničko ime na Signalu i tekst upozorenja (kao i Signal).",
      },
      ...(hasTelegram
        ? [
            {
              name: "Telegram",
              role: "Dostavlja upozorenja na Telegramu putem svog Bot API-ja.",
              receives: "ID tvog razgovora na Telegramu i tekst upozorenja.",
            },
          ]
        : []),
      {
        name: "Pružatelji RPC usluga (PublicNode, Alchemy i javne točke pristupa mreža)",
        role: "Odgovaraju na čitanja s blockchaina: iz tvog preglednika za nadzornu ploču te s našeg poslužitelja za provjere upozorenja i za provjeru potpisa za prijavu iz pametnih novčanika.",
        receives:
          "Adresu novčanika koja se čita (i, kad se prijavljuješ, tvoj potpis) te tvoju IP adresu za čitanja iz tvog preglednika.",
      },
      {
        name: "Morphov API",
        role: "Pronalazi navedena tržišta na Morphu na kojima se tvoj novčanik zadužuje, za nadzornu ploču za Morpho, i javlja našem poslužitelju je li tržište navedeno kad spremiš upozorenje za Morpho.",
        receives: "Adresu tvog novčanika te tvoju IP adresu za upite koje šalje tvoj preglednik.",
      },
      {
        name: "WalletConnect",
        role: "Prenosi vezu između ove stranice i aplikacije tvog novčanika, ako se povezuješ putem WalletConnecta.",
        receives:
          "Ono što aplikacija tvog novčanika i ova stranica razmjenjuju radi povezivanja, poput adrese tvog novčanika.",
      },
    ],
    receives: receives => `Prima: ${receives}`,
    ownPolicy: "Svaki od ovih servisa obrađuje te podatke prema vlastitim pravilima privatnosti.",
  },
  onChain: {
    title: "Što je javno na blockchainu",
    text: paymentChainName =>
      `Plaćanje upozorenja odvija se ${paymentChainName ? hrOnMarket(paymentChainName, "network") : "na mreži za plaćanje"}. Svako plaćanje bilježi adresu koja plaća, token, iznos, vrijeme, kupljeno razdoblje i novi datum isteka u javnom događaju koji svatko može pročitati i nitko ne može izbrisati. Tvoje postavke upozorenja nikad se ne zapisuju na blockchain.`,
  },
  retention: {
    title: "Koliko dugo ih čuvamo i kako ih izbrisati",
    settings:
      "Postavke upozorenja ostaju dok ne izbrišeš upozorenje na nadzornoj ploči. Brisanje uklanja postavke za tu mrežu, uključujući adresu e-pošte i korisničko ime na Signalu, i zahtijeva aktivan pristup.",
    telegramStop:
      "Slanje naredbe /stop Tokenping botu na Telegramu odspaja tvoj razgovor i zaustavlja upozorenja na Telegramu.",
    contact: {
      before: `Ako je tvoj pristup istekao ili želiš da uklonimo tvoj odgovor na pitanje ${ATTRIBUTION_QUESTION_HR}, piši nam na`,
      x: "X-u",
      middle: "ili u našoj zajednici na",
      telegram: "Telegramu",
      or: "ili",
      signal: "Signalu",
      after: "i izbrisat ćemo ga.",
    },
    payments: "Plaćanja na blockchainu nitko ne može izbrisati.",
  },
  homepage: {
    before: "Odgovori na pitanja o tome kako rade upozorenja nalaze se na ",
    link: "početnoj stranici",
    after: ".",
  },
};
