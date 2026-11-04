import type { PrivacyMessages } from "./shared";

const ATTRIBUTION_QUESTION_DA = "»Hvordan hørte du om Tokenping?«";

export const MESSAGES: PrivacyMessages = {
  metaTitle: "Privatliv og data",
  metaDescription:
    "Hvad Tokenping gemmer ved en health factor-alarm for Aave, hvad det ikke gemmer, hvilke tjenester der behandler dine data, og hvordan du sletter dem.",
  crumbHome: "Forside",
  crumbPrivacy: "Privatliv",
  title: "Privatliv: hvad Tokenping gemmer, og hvem der behandler det",
  lastUpdated: "Senest opdateret",
  intro:
    "Denne side beskriver, hvad appen gør i dag. Tokenping er i beta, og vi opdaterer siden, når det, vi indsamler, ændrer sig.",
  withoutUs: {
    title: "Hvad du kan gøre uden at give os noget",
    text: "At læse hjemmesiden og bloggen og at se dine positioner i oversigten tilføjer intet til vores database. For at vise dine positioner spørger din browser RPC-udbydere (nævnt nedenfor) om din wallets data på Aave, så de ser din wallet-adresse.",
    morpho:
      "I oversigten for Morpho sender din browser også din wallet-adresse til Morphos API, som finder de markeder på Morpho, hvor du låner, og læser dine positioner på Morpho fra de samme RPC-udbydere.",
  },
  stored: {
    title: "Hvad vi gemmer, når du gemmer en alarm",
    items: [
      "Din wallet-adresse.",
      "Det netværk, alarmen gælder for, og din tærskel.",
      "De kanaler, du valgte, og sproget for hver af dem.",
      "Din e-mailadresse, hvis du valgte e-mail.",
      "Dit brugernavn på Signal, hvis du valgte Signal.",
      "Hvornår alarmen blev oprettet og senest ændret.",
      "Hvornår du senest sendte en testbesked via hver kanal, så vi kan tillade én test pr. kanal hvert 15. minut.",
    ],
    telegram:
      "Hvis du vælger Telegram, gemmer vi det brugernavn på Telegram, som du skriver i alarmen. Når den konto trykker på Start i Tokenping-botten, gemmer vi også dens chat-ID, og hvornår den trykkede på Start, så alarmerne kan nå frem til den. Alle kan tjekke, om et brugernavn på Telegram har trykket på Start i botten.",
    attribution: `Hvis du besvarer det valgfrie spørgsmål ${ATTRIBUTION_QUESTION_DA} efter at have gemt en alarm, gemmer vi dit svar og tidspunktet sammen med din wallet-adresse.`,
  },
  notStored: {
    title: "Hvad vi ikke gemmer",
    items: [
      "Dine positioner eller en historik over din health factor. De læses direkte og gemmes ikke.",
      "En log over de alarmer, vi har sendt.",
      `Sporingspixels eller reklamecookies: hjemmesiden bruger ingen. Når du logger ind med din wallet, sætter Tokenping én cookie, som kun angiver, hvilken wallet der loggede ind; den gælder i 7 dage, eller indtil du afbryder forbindelsen til din wallet på denne hjemmeside. Mens du logger ind, gemmer en anden cookie loginanmodningen i fem minutter. Din browser gemmer i sit eget lokale lager dit valg af tema, din wallet-forbindelse, hvilke wallets der har logget ind i den, og om den allerede har vist dig spørgsmålet ${ATTRIBUTION_QUESTION_DA}.`,
      "IP-adresser i vores database. Vercel behandler dog hver anmodning, som nævnt nedenfor. Når et alarmtjek eller en besked mislykkes, havner fejlen, som kan indeholde din wallet-adresse og modtageren, i vores serverlogs.",
    ],
  },
  whoCanSee: {
    title: "Hvem der kan se dine alarmindstillinger",
    tiedToWallet:
      "Alarmindstillingerne er knyttet til en wallet-adresse, ikke til en konto med adgangskode. For at se eller ændre dem signerer du en besked med den wallet, hvilket beviser, at adressen er din. Det er ikke en transaktion og koster ingen gas, og én signatur gælder i 7 dage i den browser.",
    anyone: hasTelegram =>
      `Kun den, der kan signere med din wallet, kan se den e-mailadresse${hasTelegram ? ", det brugernavn på Signal og det brugernavn på Telegram" : " og det brugernavn på Signal"}, der er gemt for den, eller ændre eller slette dens alarmer. De offentlige betalingsoplysninger, der er beskrevet nedenfor, viser dog stadig, hvilke wallets der har betalt.`,
    dontEnter:
      "Angiv ikke en e-mailadresse eller et brugernavn på Signal, som du ikke vil have knyttet til din wallet-adresse.",
  },
  processors: {
    title: "Hvem der behandler dine data",
    list: ({ minutes, hasTelegram }) => [
      {
        name: "Vercel",
        role: `Hoster denne hjemmeside og kører alarmtjekket ${minutes === 1 ? "hvert minut" : `hvert ${minutes}. minut`}.`,
        receives: "Hver anmodning til hjemmesiden, inklusive din IP-adresse, og vores serverlogs.",
      },
      {
        name: "Vercel Web Analytics",
        role: "Tæller sidevisninger, uden cookies.",
        receives:
          "For hver sidevisning: sidens adresse, den hjemmeside, du kom fra, din omtrentlige placering samt din browser, dit styresystem og din enhedstype. En besøgende er en hash af anmodningen, der skifter hver 24. time, så besøg ikke kan kobles sammen på tværs af dage eller hjemmesider.",
      },
      { name: "Supabase", role: "Vores database.", receives: "Alarmindstillingerne, der er nævnt ovenfor." },
      { name: "Resend", role: "Sender alarmer via e-mail.", receives: "Din e-mailadresse og alarmens tekst." },
      {
        name: "Fly.io (vores Signal-relæ)",
        role: "Hoster serveren signal-cli-rest-api, som vi kører, og som giver alarmerne videre til Signal.",
        receives: "Dit brugernavn på Signal og alarmens tekst (det gør Signal også).",
      },
      ...(hasTelegram
        ? [
            {
              name: "Telegram",
              role: "Leverer alarmer på Telegram via sit Bot API.",
              receives: "Dit chat-ID på Telegram og alarmens tekst.",
            },
          ]
        : []),
      {
        name: "RPC-udbydere (PublicNode, Alchemy og netværkenes offentlige endpoints)",
        role: "Besvarer læsningerne fra blockchainen: fra din browser til oversigten og fra vores server til alarmtjek og til at kontrollere loginsignaturer fra smart wallets.",
        receives:
          "Den wallet-adresse, der læses (og, når du logger ind, din signatur), og din IP-adresse ved læsninger, der foretages fra din browser.",
      },
      {
        name: "Morphos API",
        role: "Finder de listede markeder på Morpho, hvor din wallet låner, til oversigten for Morpho, og fortæller vores server, om et marked er listet, når du gemmer en alarm for Morpho.",
        receives: "Din wallet-adresse og din IP-adresse ved de opslag, din browser foretager.",
      },
      {
        name: "WalletConnect",
        role: "Formidler forbindelsen mellem denne hjemmeside og din wallet-app, hvis du forbinder med WalletConnect.",
        receives: "Det, som din wallet-app og denne hjemmeside udveksler for at forbinde, f.eks. din wallet-adresse.",
      },
    ],
    receives: receives => `Modtager: ${receives}`,
    ownPolicy: "Hver af disse tjenester behandler dataene efter sin egen privatlivspolitik.",
  },
  onChain: {
    title: "Hvad der er offentligt på blockchainen",
    text: paymentChainName =>
      `Betalingen for alarmer sker på ${paymentChainName ?? "betalingsnetværket"}. Hver betaling registrerer den betalende adresse, token, beløbet, tidspunktet, den købte periode og den nye udløbsdato i en offentlig hændelse, som alle kan læse, og som ingen kan slette. Dine alarmindstillinger skrives aldrig til en blockchain.`,
  },
  retention: {
    title: "Hvor længe vi gemmer det, og hvordan du sletter det",
    settings:
      "Alarmindstillingerne bliver gemt, indtil du sletter alarmen i oversigten. Sletningen fjerner indstillingerne for det netværk, inklusive e-mailadressen og brugernavnet på Signal, og kræver aktiv adgang.",
    telegramStop:
      "Hvis du sender /stop til Tokenping-botten i Telegram, bliver din chat koblet fra, og alarmerne på Telegram stopper.",
    contact: {
      before: `Hvis din adgang er udløbet, eller hvis du vil have dit svar på ${ATTRIBUTION_QUESTION_DA} fjernet, så skriv til os på`,
      x: "X",
      middle: "eller i vores fællesskab på",
      telegram: "Telegram",
      or: "eller",
      signal: "Signal",
      after: "så sletter vi det.",
    },
    payments: "Betalinger på blockchainen kan ikke slettes af nogen.",
  },
  homepage: { before: "Spørgsmål om, hvordan alarmerne fungerer, besvares på ", link: "forsiden", after: "." },
};
