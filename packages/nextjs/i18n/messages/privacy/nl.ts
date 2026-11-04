import type { PrivacyMessages } from "./shared";

const ATTRIBUTION_QUESTION_NL = '"Hoe heb je over Tokenping gehoord?"';

export const MESSAGES: PrivacyMessages = {
  metaTitle: "Privacy en gegevens",
  metaDescription:
    "Wat Tokenping opslaat als je een health factor-alert voor Aave instelt, wat niet, welke diensten je gegevens verwerken en hoe je ze verwijdert.",
  crumbHome: "Home",
  crumbPrivacy: "Privacy",
  title: "Privacy: wat Tokenping opslaat en wie het verwerkt",
  lastUpdated: "Laatst bijgewerkt op",
  intro:
    "Deze pagina beschrijft wat de app vandaag doet. Tokenping is in bèta, en we werken deze pagina bij als verandert wat we verzamelen.",
  withoutUs: {
    title: "Wat je kunt doen zonder ons iets te geven",
    text: "De site en de blog lezen en je posities op het dashboard bekijken, voegt niets toe aan onze database. Om je posities te tonen, vraagt je browser RPC-providers (hieronder vermeld) om de Aave-gegevens van je wallet, dus zij zien je walletadres.",
    morpho:
      "Op het Morpho-dashboard stuurt je browser je walletadres ook naar de API van Morpho, die de Morpho-markten vindt waarin je leent, en leest hij je Morpho-posities via dezelfde RPC-providers.",
  },
  stored: {
    title: "Wat we opslaan als je een alert opslaat",
    items: [
      "Je walletadres.",
      "Het netwerk waarvoor de alert geldt, en je drempel.",
      "De kanalen die je hebt gekozen, en de taal van elk kanaal.",
      "Je e-mailadres, als je e-mail hebt gekozen.",
      "Je Signal-gebruikersnaam, als je Signal hebt gekozen.",
      "Wanneer de alert is aangemaakt en voor het laatst is gewijzigd.",
      "Wanneer je voor het laatst een testbericht via elk kanaal hebt verstuurd, om één test per kanaal per 15 minuten toe te staan.",
    ],
    telegram:
      "Als je Telegram kiest, slaan we de Telegram-gebruikersnaam op die je in de alert invult. Als dat account in de Tokenping-bot op Start drukt, slaan we ook de chat-ID op en wanneer het op Start drukte, zodat alerts het kunnen bereiken. Iedereen kan controleren of een Telegram-gebruikersnaam in de bot op Start heeft gedrukt.",
    attribution: `Als je na het opslaan van een alert de optionele vraag ${ATTRIBUTION_QUESTION_NL} beantwoordt, slaan we je antwoord en het tijdstip op bij je walletadres.`,
  },
  notStored: {
    title: "Wat we niet opslaan",
    items: [
      "Je posities of een geschiedenis van je health factor. Die worden live gelezen en niet bewaard.",
      "Een logboek van de alerts die we hebben verstuurd.",
      `Trackingpixels of advertentiecookies: de site gebruikt er geen. Als je inlogt met je wallet, plaatst Tokenping één cookie die alleen zegt welke wallet heeft ingelogd; die blijft 7 dagen geldig of tot je de wallet op deze site ontkoppelt. Tijdens het inloggen bewaart een tweede cookie het inlogverzoek vijf minuten lang. Je browser bewaart in zijn eigen lokale opslag je themakeuze, je walletverbinding, welke wallets erop hebben ingelogd en of hij je de vraag ${ATTRIBUTION_QUESTION_NL} al heeft getoond.`,
      "IP-adressen in onze database. Vercel verwerkt wel elk verzoek, zoals hieronder vermeld. Als een alertcontrole of een bericht mislukt, gaat de foutmelding, waarin je walletadres en de ontvanger kunnen staan, naar onze serverlogs.",
    ],
  },
  whoCanSee: {
    title: "Wie je alertinstellingen kan zien",
    tiedToWallet:
      "Alertinstellingen zijn gekoppeld aan een walletadres, niet aan een account met een wachtwoord. Om ze te zien of te wijzigen, onderteken je een bericht met die wallet, wat bewijst dat het adres van jou is. Het is geen transactie en kost geen gas, en één handtekening blijft 7 dagen geldig in die browser.",
    anyone: hasTelegram =>
      `Alleen wie met je wallet kan ondertekenen, kan het e-mailadres${hasTelegram ? ", de Signal-gebruikersnaam en de Telegram-gebruikersnaam" : " en de Signal-gebruikersnaam"} zien die ervoor zijn opgeslagen, of de alerts ervan wijzigen of verwijderen. De openbare betaalgegevens die hieronder worden beschreven, laten nog steeds zien welke wallets hebben betaald.`,
    dontEnter: "Vul geen e-mailadres of Signal-gebruikersnaam in die je niet aan je walletadres gekoppeld wilt zien.",
  },
  processors: {
    title: "Wie je gegevens verwerkt",
    list: ({ minutes, hasTelegram }) => [
      {
        name: "Vercel",
        role: `Host deze site en voert ${minutes === 1 ? "elke minuut" : `elke ${minutes} minuten`} de alertcontrole uit.`,
        receives: "Elk verzoek aan de site, inclusief je IP-adres, en onze serverlogs.",
      },
      {
        name: "Vercel Web Analytics",
        role: "Telt paginaweergaven, zonder cookies.",
        receives:
          "Bij elke paginaweergave: het adres van de pagina, de site waar je vandaan kwam, je locatie bij benadering en je browser, besturingssysteem en type apparaat. Een bezoeker is een hash van het verzoek die elke 24 uur verandert, dus bezoeken kunnen niet over dagen of sites heen aan elkaar worden gekoppeld.",
      },
      { name: "Supabase", role: "Onze database.", receives: "De alertinstellingen die hierboven staan." },
      { name: "Resend", role: "Verstuurt alert-e-mails.", receives: "Je e-mailadres en de tekst van de alert." },
      {
        name: "Fly.io (onze Signal-relay)",
        role: "Host de signal-cli-rest-api-server die wij draaien, die Signal-alerts aan Signal doorgeeft.",
        receives: "Je Signal-gebruikersnaam en de tekst van de alert (en Signal dus ook).",
      },
      ...(hasTelegram
        ? [
            {
              name: "Telegram",
              role: "Bezorgt Telegram-alerts via de Bot API.",
              receives: "Je Telegram-chat-ID en de tekst van de alert.",
            },
          ]
        : []),
      {
        name: "RPC-providers (PublicNode, Alchemy en de openbare endpoints van de netwerken)",
        role: "Beantwoorden de blockchainverzoeken: vanuit je browser voor het dashboard, en vanuit onze server voor alertcontroles en om inloghandtekeningen van smart wallets te controleren.",
        receives:
          "Het walletadres dat wordt gelezen (en, als je inlogt, je handtekening), en je IP-adres bij verzoeken vanuit je browser.",
      },
      {
        name: "De API van Morpho",
        role: "Vindt de vermelde Morpho-markten waarin je wallet leent, voor het Morpho-dashboard, en vertelt onze server of een markt vermeld is als je een Morpho-alert opslaat.",
        receives: "Je walletadres, en je IP-adres bij de opzoekingen die je browser doet.",
      },
      {
        name: "WalletConnect",
        role: "Geeft de verbinding tussen deze site en je wallet-app door, als je koppelt met WalletConnect.",
        receives: "Wat je wallet-app en deze site uitwisselen om te koppelen, zoals je walletadres.",
      },
    ],
    receives: receives => `Ontvangt: ${receives}`,
    ownPolicy: "Elk van deze diensten verwerkt die gegevens volgens zijn eigen privacybeleid.",
  },
  onChain: {
    title: "Wat openbaar is op de blockchain",
    text: paymentChainName =>
      `Betalen voor alerts gebeurt op ${paymentChainName ?? "het betaalnetwerk"}. Elke betaling legt het betalende adres, de token, het bedrag, het tijdstip, de gekochte periode en de nieuwe vervaldatum vast in een openbaar event dat iedereen kan lezen en niemand kan verwijderen. Je alertinstellingen worden nooit naar een blockchain geschreven.`,
  },
  retention: {
    title: "Hoe lang we het bewaren en hoe je het verwijdert",
    settings:
      "Alertinstellingen blijven staan tot je de alert op het dashboard verwijdert. Verwijderen wist de instellingen van dat netwerk, inclusief het e-mailadres en de Signal-gebruikersnaam, en vraagt actieve toegang.",
    telegramStop:
      "Als je /stop naar de Tokenping-bot in Telegram stuurt, wordt je chat ontkoppeld en stoppen de Telegram-alerts.",
    contact: {
      before: `Is je toegang verlopen, of wil je je antwoord op ${ATTRIBUTION_QUESTION_NL} laten verwijderen? Stuur ons een bericht op`,
      x: "X",
      middle: "of in onze community op",
      telegram: "Telegram",
      or: "of",
      signal: "Signal",
      after: "en we verwijderen het.",
    },
    payments: "Betalingen op de blockchain kan niemand verwijderen.",
  },
  homepage: { before: "Vragen over hoe alerts werken worden beantwoord op de ", link: "homepage", after: "." },
};
