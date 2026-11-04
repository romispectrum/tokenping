import type { PrivacyMessages } from "./shared";
import { plural, srOnMarket } from "~~/i18n/format";

const ATTRIBUTION_QUESTION_SR = "„Kako si saznao za Tokenping?“";

/** "svakih 5 minuta", "svaka 2 minuta", "svakog minuta" (minut is masculine in Serbian). */
const everyMinutes = (minutes: number) =>
  minutes === 1
    ? "svakog minuta"
    : plural("sr", minutes, {
        one: `svaki ${minutes} minut`,
        few: `svaka ${minutes} minuta`,
        other: `svakih ${minutes} minuta`,
      });

export const MESSAGES: PrivacyMessages = {
  metaTitle: "Privatnost i podaci",
  metaDescription:
    "Šta Tokenping čuva kad podesiš Aave upozorenje za health factor, šta ne čuva, koji servisi obrađuju tvoje podatke i kako da ih obrišeš.",
  crumbHome: "Početna",
  crumbPrivacy: "Privatnost",
  title: "Privatnost: šta Tokenping čuva i ko to obrađuje",
  lastUpdated: "Poslednje ažuriranje",
  intro:
    "Ova stranica opisuje šta aplikacija radi danas. Tokenping je u beta verziji i ovu stranicu ažuriramo kad se promeni ono što prikupljamo.",
  withoutUs: {
    title: "Šta možeš da radiš a da nam ništa ne daš",
    text: "Čitanje sajta i bloga, kao i pregled tvojih pozicija na kontrolnoj tabli, ne dodaju ništa u našu bazu podataka. Da bi prikazao tvoje pozicije, tvoj pregledač od RPC provajdera (navedeni su niže) traži Aave podatke tvog novčanika, pa oni vide adresu tvog novčanika.",
    morpho:
      "Na kontrolnoj tabli za Morpho tvoj pregledač šalje adresu tvog novčanika i Morpho API-ju, koji pronalazi Morpho tržišta na kojima se zadužuješ, a tvoje Morpho pozicije čita od istih RPC provajdera.",
  },
  stored: {
    title: "Šta čuvamo kad sačuvaš upozorenje",
    items: [
      "Adresu tvog novčanika.",
      "Mrežu na koju se upozorenje odnosi i tvoj prag.",
      "Kanale koje si izabrao i jezik svakog od njih.",
      "Tvoju adresu e-pošte, ako si izabrao e-poštu.",
      "Tvoje korisničko ime na Signalu, ako si izabrao Signal.",
      "Kada je upozorenje napravljeno i kada je poslednji put izmenjeno.",
      "Kada si poslednji put poslao test poruku na svakom kanalu, kako bi bio moguć jedan test po kanalu na svakih 15 minuta.",
    ],
    telegram:
      "Ako izabereš Telegram, čuvamo korisničko ime na Telegramu koje upišeš u upozorenje. Kad taj nalog pritisne Start u Tokenping botu, čuvamo i ID njegovog razgovora i vreme kada je pritisnuo Start, kako bi upozorenja mogla da stignu do njega. Svako može da proveri da li je neko korisničko ime na Telegramu pritisnulo Start u botu.",
    attribution: `Ako posle čuvanja upozorenja odgovoriš na opciono pitanje ${ATTRIBUTION_QUESTION_SR}, čuvamo tvoj odgovor i vreme uz adresu tvog novčanika.`,
  },
  notStored: {
    title: "Šta ne čuvamo",
    items: [
      "Tvoje pozicije ni istoriju tvog health factora. Čitaju se uživo i ne čuvaju se.",
      "Evidenciju poslatih upozorenja.",
      `Piksele za praćenje ni reklamne kolačiće: sajt ne koristi nijedne. Kad se prijaviš novčanikom, Tokenping postavlja jedan kolačić koji govori samo koji se novčanik prijavio; važi 7 dana ili dok ne prekineš vezu sa novčanikom na ovom sajtu. Dok se prijavljuješ, drugi kolačić pet minuta čuva zahtev za prijavu. Tvoj pregledač u sopstvenoj lokalnoj memoriji čuva tvoj izbor teme, vezu sa novčanikom, koji su se novčanici na njemu prijavili i da li ti je već prikazao pitanje ${ATTRIBUTION_QUESTION_SR}.`,
      "IP adrese u našoj bazi podataka. Vercel ipak obrađuje svaki zahtev, kako je navedeno niže. Kad provera upozorenja ili slanje poruke ne uspe, greška, koja može da sadrži adresu tvog novčanika i primaoca, odlazi u logove našeg servera.",
    ],
  },
  whoCanSee: {
    title: "Ko može da vidi tvoja podešavanja upozorenja",
    tiedToWallet:
      "Podešavanja upozorenja su vezana za adresu novčanika, a ne za nalog sa lozinkom. Da bi ih video ili izmenio, potpisuješ poruku tim novčanikom, čime dokazuješ da je adresa tvoja. To nije transakcija i ne troši gas, a jedan potpis važi 7 dana u tom pregledaču.",
    anyone: hasTelegram =>
      `Samo neko ko može da potpisuje tvojim novčanikom može da vidi adresu e-pošte${hasTelegram ? ", korisničko ime na Signalu i korisničko ime na Telegramu" : " i korisničko ime na Signalu"} sačuvane za njega, kao i da izmeni ili obriše njegova upozorenja. Javni zapisi o plaćanjima opisani niže ipak pokazuju koji su novčanici platili.`,
    dontEnter:
      "Ne unosi adresu e-pošte ni korisničko ime na Signalu koje ne želiš da povežeš sa adresom svog novčanika.",
  },
  processors: {
    title: "Ko obrađuje tvoje podatke",
    list: ({ minutes, hasTelegram }) => [
      {
        name: "Vercel",
        role: `Hostuje ovaj sajt i pokreće proveru upozorenja ${everyMinutes(minutes)}.`,
        receives: "Svaki zahtev prema sajtu, uključujući tvoju IP adresu, i logove našeg servera.",
      },
      {
        name: "Vercel Web Analytics",
        role: "Broji preglede stranica, bez kolačića.",
        receives:
          "Za svaki pregled stranice: adresu stranice, sajt sa kog dolaziš, tvoju približnu lokaciju, kao i tvoj pregledač, operativni sistem i vrstu uređaja. Posetilac je hash zahteva koji se menja na svaka 24 sata, pa posete ne mogu da se povežu kroz dane ni između sajtova.",
      },
      { name: "Supabase", role: "Naša baza podataka.", receives: "Gore navedena podešavanja upozorenja." },
      {
        name: "Resend",
        role: "Šalje upozorenja e-poštom.",
        receives: "Tvoju adresu e-pošte i tekst upozorenja.",
      },
      {
        name: "Fly.io (naš posrednik za Signal)",
        role: "Hostuje server signal-cli-rest-api koji pokrećemo i koji predaje upozorenja Signalu.",
        receives: "Tvoje korisničko ime na Signalu i tekst upozorenja (kao i Signal).",
      },
      ...(hasTelegram
        ? [
            {
              name: "Telegram",
              role: "Dostavlja upozorenja na Telegramu preko svog Bot API-ja.",
              receives: "ID tvog razgovora na Telegramu i tekst upozorenja.",
            },
          ]
        : []),
      {
        name: "RPC provajderi (PublicNode, Alchemy i javne pristupne tačke mreža)",
        role: "Odgovaraju na čitanja sa blockchaina: iz tvog pregledača za kontrolnu tablu, a sa našeg servera za provere upozorenja i za proveru potpisa za prijavu iz pametnih novčanika.",
        receives:
          "Adresu novčanika koja se čita (i, kad se prijavljuješ, tvoj potpis), kao i tvoju IP adresu za čitanja iz tvog pregledača.",
      },
      {
        name: "Morpho API",
        role: "Pronalazi navedena Morpho tržišta na kojima se tvoj novčanik zadužuje, za kontrolnu tablu za Morpho, i javlja našem serveru da li je tržište navedeno kad sačuvaš Morpho upozorenje.",
        receives: "Adresu tvog novčanika, kao i tvoju IP adresu za upite koje šalje tvoj pregledač.",
      },
      {
        name: "WalletConnect",
        role: "Prenosi vezu između ovog sajta i aplikacije tvog novčanika, ako se povezuješ preko WalletConnect-a.",
        receives:
          "Ono što aplikacija tvog novčanika i ovaj sajt razmenjuju radi povezivanja, poput adrese tvog novčanika.",
      },
    ],
    receives: receives => `Prima: ${receives}`,
    ownPolicy: "Svaki od ovih servisa obrađuje te podatke prema sopstvenoj politici privatnosti.",
  },
  onChain: {
    title: "Šta je javno na blockchainu",
    text: paymentChainName =>
      `Plaćanje upozorenja se odvija ${paymentChainName ? srOnMarket(paymentChainName, "network") : "na mreži za plaćanje"}. Svako plaćanje beleži adresu koja plaća, token, iznos, vreme, kupljeni period i novi datum isteka u javnom događaju koji svako može da pročita i niko ne može da obriše. Tvoja podešavanja upozorenja se nikad ne upisuju na blockchain.`,
  },
  retention: {
    title: "Koliko dugo ih čuvamo i kako da ih obrišeš",
    settings:
      "Podešavanja upozorenja ostaju dok ne obrišeš upozorenje na kontrolnoj tabli. Brisanje uklanja podešavanja za tu mrežu, uključujući adresu e-pošte i korisničko ime na Signalu, i zahteva aktivan pristup.",
    telegramStop:
      "Slanje komande /stop Tokenping botu na Telegramu prekida vezu sa tvojim razgovorom i zaustavlja upozorenja na Telegramu.",
    contact: {
      before: `Ako je tvoj pristup istekao ili želiš da uklonimo tvoj odgovor na pitanje ${ATTRIBUTION_QUESTION_SR}, piši nam na`,
      x: "X-u",
      middle: "ili u našoj zajednici na",
      telegram: "Telegramu",
      or: "ili",
      signal: "Signalu",
      after: "i obrisaćemo ga.",
    },
    payments: "Plaćanja na blockchainu niko ne može da obriše.",
  },
  homepage: {
    before: "Odgovori na pitanja o tome kako rade upozorenja nalaze se na ",
    link: "početnoj strani",
    after: ".",
  },
};
