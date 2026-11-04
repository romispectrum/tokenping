import type { PrivacyMessages } from "./shared";

const ATTRIBUTION_QUESTION_NB = "«Hvordan hørte du om Tokenping?»";

export const MESSAGES: PrivacyMessages = {
  metaTitle: "Personvern og data",
  metaDescription:
    "Hva Tokenping lagrer når du setter opp et health factor-varsel for Aave, hva som ikke lagres, hvilke tjenester som får dataene og hvordan du sletter dem.",
  crumbHome: "Hjem",
  crumbPrivacy: "Personvern",
  title: "Personvern: hva Tokenping lagrer og hvem som behandler det",
  lastUpdated: "Sist oppdatert",
  intro:
    "Denne siden beskriver hva appen gjør i dag. Tokenping er i beta, og vi oppdaterer siden når det vi samler inn, endres.",
  withoutUs: {
    title: "Hva du kan gjøre uten å gi oss noe",
    text: "Å lese nettstedet og bloggen og å se på posisjonene dine i oversikten legger ikke til noe i databasen vår. For å vise posisjonene dine spør nettleseren din RPC-leverandører (oppført nedenfor) om lommebokens data på Aave, så de ser lommebokadressen din.",
    morpho:
      "I oversikten for Morpho sender nettleseren din også lommebokadressen din til Morphos API, som finner markedene på Morpho der du låner, og leser posisjonene dine på Morpho fra de samme RPC-leverandørene.",
  },
  stored: {
    title: "Hva vi lagrer når du lagrer et varsel",
    items: [
      "Lommebokadressen din.",
      "Nettverket varselet gjelder, og terskelen din.",
      "Kanalene du valgte, og språket for hver av dem.",
      "E-postadressen din, hvis du valgte e-post.",
      "Brukernavnet ditt på Signal, hvis du valgte Signal.",
      "Når varselet ble opprettet og sist endret.",
      "Når du sist sendte en testmelding via hver kanal, for å tillate én test per kanal hvert 15. minutt.",
    ],
    telegram:
      "Hvis du velger Telegram, lagrer vi brukernavnet på Telegram som du skriver inn i varselet. Når den kontoen trykker på Start i Tokenping-boten, lagrer vi også chat-ID-en og når den trykket på Start, slik at varslene kan nå den. Hvem som helst kan sjekke om et brukernavn på Telegram har trykket på Start i boten.",
    attribution: `Hvis du svarer på det valgfrie spørsmålet ${ATTRIBUTION_QUESTION_NB} etter at du har lagret et varsel, lagrer vi svaret ditt og tidspunktet sammen med lommebokadressen din.`,
  },
  notStored: {
    title: "Hva vi ikke lagrer",
    items: [
      "Posisjonene dine eller en historikk over health factor. De leses direkte og lagres ikke.",
      "En logg over varslene vi har sendt.",
      `Sporingspiksler eller reklamecookies: nettstedet bruker ingen. Når du logger inn med lommeboken, setter Tokenping én cookie som bare sier hvilken lommebok som logget inn; den varer i 7 dager eller til du kobler fra lommeboken på dette nettstedet. Mens du logger inn, holder en cookie til på innloggingsforespørselen i fem minutter. Nettleseren din lagrer i sin egen lokale lagring temavalget ditt, lommeboktilkoblingen din, hvilke lommebøker som har logget inn i den, og om den allerede har vist deg spørsmålet ${ATTRIBUTION_QUESTION_NB}.`,
      "IP-adresser i databasen vår. Vercel behandler likevel hver forespørsel, som oppført nedenfor. Når en varselsjekk eller en melding mislykkes, havner feilen, som kan inneholde lommebokadressen din og mottakeren, i serverloggene våre.",
    ],
  },
  whoCanSee: {
    title: "Hvem som kan se varselinnstillingene dine",
    tiedToWallet:
      "Varselinnstillingene er knyttet til en lommebokadresse, ikke til en konto med passord. For å se eller endre dem signerer du en melding med den lommeboken, som beviser at adressen er din. Det er ingen transaksjon og koster ingen gas, og én signatur varer i 7 dager i den nettleseren.",
    anyone: hasTelegram =>
      `Bare den som kan signere med lommeboken din, kan se e-postadressen${hasTelegram ? ", brukernavnet på Signal og brukernavnet på Telegram" : " og brukernavnet på Signal"} som er lagret for den, eller endre eller slette varslene for den. De offentlige betalingsopplysningene som er beskrevet nedenfor, viser likevel hvilke lommebøker som har betalt.`,
    dontEnter:
      "Ikke skriv inn en e-postadresse eller et brukernavn på Signal som du ikke vil skal knyttes til lommebokadressen din.",
  },
  processors: {
    title: "Hvem som behandler dataene dine",
    list: ({ minutes, hasTelegram }) => [
      {
        name: "Vercel",
        role: `Drifter dette nettstedet og kjører varselsjekken ${minutes === 1 ? "hvert minutt" : `hvert ${minutes}. minutt`}.`,
        receives: "Hver forespørsel til nettstedet, inkludert IP-adressen din, og serverloggene våre.",
      },
      {
        name: "Vercel Web Analytics",
        role: "Teller sidevisninger, uten cookies.",
        receives:
          "For hver sidevisning: sidens adresse, nettstedet du kom fra, din omtrentlige plassering og nettleseren, operativsystemet og enhetstypen din. En besøkende er en hash av forespørselen som endres hver 24. time, så besøk kan ikke kobles sammen på tvers av dager eller nettsteder.",
      },
      { name: "Supabase", role: "Databasen vår.", receives: "Varselinnstillingene som er oppført ovenfor." },
      { name: "Resend", role: "Sender varsler på e-post.", receives: "E-postadressen din og varselteksten." },
      {
        name: "Fly.io (Signal-reléet vårt)",
        role: "Drifter serveren signal-cli-rest-api som vi kjører, og som leverer varslene videre til Signal.",
        receives: "Brukernavnet ditt på Signal og varselteksten (det gjør også Signal).",
      },
      ...(hasTelegram
        ? [
            {
              name: "Telegram",
              role: "Leverer varsler på Telegram via sitt Bot API.",
              receives: "Chat-ID-en din på Telegram og varselteksten.",
            },
          ]
        : []),
      {
        name: "RPC-leverandører (PublicNode, Alchemy og nettverkenes offentlige endepunkter)",
        role: "Svarer på lesingene fra blokkjeden: fra nettleseren din for oversikten, og fra serveren vår for varselsjekker og for å sjekke innloggingssignaturer fra smarte lommebøker.",
        receives:
          "Lommebokadressen som leses (og, når du logger inn, signaturen din), og IP-adressen din for lesinger som gjøres fra nettleseren din.",
      },
      {
        name: "Morphos API",
        role: "Finner de oppførte markedene på Morpho der lommeboken din låner, for oversikten for Morpho, og forteller serveren vår om et marked er oppført når du lagrer et varsel for Morpho.",
        receives: "Lommebokadressen din, og IP-adressen din for oppslagene nettleseren din gjør.",
      },
      {
        name: "WalletConnect",
        role: "Formidler tilkoblingen mellom dette nettstedet og lommebokappen din, hvis du kobler til med WalletConnect.",
        receives:
          "Det lommebokappen din og dette nettstedet utveksler for å koble til, for eksempel lommebokadressen din.",
      },
    ],
    receives: receives => `Mottar: ${receives}`,
    ownPolicy: "Hver av disse tjenestene behandler dataene etter sin egen personvernerklæring.",
  },
  onChain: {
    title: "Hva som er offentlig på blokkjeden",
    text: paymentChainName =>
      `Betalingen for varsler skjer på ${paymentChainName ?? "betalingsnettverket"}. Hver betaling registrerer den betalende adressen, tokenet, beløpet, tidspunktet, perioden som er kjøpt, og den nye utløpsdatoen i en offentlig hendelse som hvem som helst kan lese og ingen kan slette. Varselinnstillingene dine skrives aldri til en blokkjede.`,
  },
  retention: {
    title: "Hvor lenge vi beholder det, og hvordan du sletter det",
    settings:
      "Varselinnstillingene ligger lagret til du sletter varselet i oversikten. Sletting fjerner innstillingene for det nettverket, inkludert e-postadressen og brukernavnet på Signal, og krever aktiv tilgang.",
    telegramStop:
      "Hvis du sender /stop til Tokenping-boten i Telegram, kobles chatten din fra og varslene på Telegram stopper.",
    contact: {
      before: `Hvis tilgangen din har utløpt, eller du vil at svaret ditt på ${ATTRIBUTION_QUESTION_NB} skal fjernes, skriv til oss på`,
      x: "X",
      middle: "eller i fellesskapet vårt på",
      telegram: "Telegram",
      or: "eller",
      signal: "Signal",
      after: "så sletter vi det.",
    },
    payments: "Betalinger på blokkjeden kan ikke slettes av noen.",
  },
  homepage: { before: "Spørsmål om hvordan varslene fungerer, besvares på ", link: "forsiden", after: "." },
};
