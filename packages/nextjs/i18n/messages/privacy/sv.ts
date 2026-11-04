import type { PrivacyMessages } from "./shared";

const ATTRIBUTION_QUESTION_SV = "”Hur hörde du talas om Tokenping?”";

export const MESSAGES: PrivacyMessages = {
  metaTitle: "Integritet och data",
  metaDescription:
    "Vad Tokenping sparar när du ställer in ett health factor-larm för Aave, vad det inte sparar, vilka tjänster som hanterar dina data och hur du raderar dem.",
  crumbHome: "Hem",
  crumbPrivacy: "Integritet",
  title: "Integritet: vad Tokenping sparar och vem som hanterar det",
  lastUpdated: "Senast uppdaterad",
  intro:
    "Den här sidan beskriver vad appen gör i dag. Tokenping är i beta, och vi uppdaterar sidan när det vi samlar in ändras.",
  withoutUs: {
    title: "Vad du kan göra utan att ge oss något",
    text: "Att läsa webbplatsen och bloggen och att titta på dina positioner i översikten lägger inte till något i vår databas. För att visa dina positioner frågar din webbläsare RPC-leverantörer (listade nedan) efter din plånboks data på Aave, så de ser din plånboksadress.",
    morpho:
      "I översikten för Morpho skickar din webbläsare också din plånboksadress till Morphos API, som hittar de marknader på Morpho där du lånar, och läser dina positioner på Morpho från samma RPC-leverantörer.",
  },
  stored: {
    title: "Vad vi sparar när du sparar ett larm",
    items: [
      "Din plånboksadress.",
      "Nätverket som larmet gäller och ditt tröskelvärde.",
      "Kanalerna du valde och språket för var och en.",
      "Din e-postadress, om du valde e-post.",
      "Ditt användarnamn på Signal, om du valde Signal.",
      "När larmet skapades och senast ändrades.",
      "När du senast skickade ett testmeddelande via varje kanal, för att tillåta ett test per kanal var 15:e minut.",
    ],
    telegram:
      "Om du väljer Telegram sparar vi det användarnamn på Telegram som du skriver in i larmet. När det kontot trycker på Start i Tokenping-boten sparar vi också dess chatt-ID och när det tryckte på Start, så att larmen kan nå det. Vem som helst kan kontrollera om ett användarnamn på Telegram har tryckt på Start i boten.",
    attribution: `Om du svarar på den valfria frågan ${ATTRIBUTION_QUESTION_SV} efter att ha sparat ett larm sparar vi ditt svar och tidpunkten tillsammans med din plånboksadress.`,
  },
  notStored: {
    title: "Vad vi inte sparar",
    items: [
      "Dina positioner eller en historik över din health factor. De läses direkt och sparas inte.",
      "En logg över de larm vi har skickat.",
      `Spårningspixlar eller reklamcookies: webbplatsen använder inga. När du loggar in med din plånbok sätter Tokenping en cookie som bara anger vilken plånbok som loggade in; den gäller i 7 dagar eller tills du kopplar från plånboken på den här webbplatsen. Medan du loggar in håller en andra cookie inloggningsbegäran i fem minuter. Din webbläsare sparar i sin egen lokala lagring ditt val av tema, din plånboksanslutning, vilka plånböcker som har loggat in i den och om den redan har visat dig frågan ${ATTRIBUTION_QUESTION_SV}.`,
      "IP-adresser i vår databas. Vercel hanterar ändå varje förfrågan, som listas nedan. När en larmkontroll eller ett meddelande misslyckas hamnar felet, som kan innehålla din plånboksadress och mottagaren, i våra serverloggar.",
    ],
  },
  whoCanSee: {
    title: "Vem som kan se dina larminställningar",
    tiedToWallet:
      "Larminställningarna är knutna till en plånboksadress, inte till ett konto med lösenord. För att se eller ändra dem signerar du ett meddelande med den plånboken, vilket bevisar att adressen är din. Det är ingen transaktion och kostar ingen gas, och en signatur gäller i 7 dagar i den webbläsaren.",
    anyone: hasTelegram =>
      `Bara den som kan signera med din plånbok kan se den e-postadress${hasTelegram ? ", det användarnamn på Signal och det användarnamn på Telegram" : " och det användarnamn på Signal"} som har sparats för den, eller ändra eller ta bort dess larm. De offentliga betalningsuppgifterna som beskrivs nedan visar ändå vilka plånböcker som har betalat.`,
    dontEnter:
      "Ange inte en e-postadress eller ett användarnamn på Signal som du inte vill ska kopplas till din plånboksadress.",
  },
  processors: {
    title: "Vem som hanterar dina uppgifter",
    list: ({ minutes, hasTelegram }) => [
      {
        name: "Vercel",
        role: `Driftar den här webbplatsen och kör larmkontrollen ${minutes === 1 ? "en gång i minuten" : `var ${minutes} minuter`}.`,
        receives: "Varje förfrågan till webbplatsen, inklusive din IP-adress, och våra serverloggar.",
      },
      {
        name: "Vercel Web Analytics",
        role: "Räknar sidvisningar, utan cookies.",
        receives:
          "För varje sidvisning: sidans adress, webbplatsen du kom från, din ungefärliga plats samt din webbläsare, ditt operativsystem och din enhetstyp. En besökare är en hash av förfrågan som ändras var 24:e timme, så besök kan inte kopplas ihop mellan dagar eller webbplatser.",
      },
      { name: "Supabase", role: "Vår databas.", receives: "Larminställningarna som listas ovan." },
      { name: "Resend", role: "Skickar larm via e-post.", receives: "Din e-postadress och larmets text." },
      {
        name: "Fly.io (vårt Signal-relä)",
        role: "Driftar servern signal-cli-rest-api som vi kör, och som lämnar över larmen till Signal.",
        receives: "Ditt användarnamn på Signal och larmets text (det gör även Signal).",
      },
      ...(hasTelegram
        ? [
            {
              name: "Telegram",
              role: "Levererar larm på Telegram via sitt Bot API.",
              receives: "Ditt chatt-ID på Telegram och larmets text.",
            },
          ]
        : []),
      {
        name: "RPC-leverantörer (PublicNode, Alchemy och nätverkens publika endpoints)",
        role: "Svarar på läsningarna från blockkedjan: från din webbläsare för översikten, och från vår server för larmkontroller och för att kontrollera inloggningssignaturer från smarta plånböcker.",
        receives:
          "Plånboksadressen som läses (och, när du loggar in, din signatur), och din IP-adress för läsningar som görs från din webbläsare.",
      },
      {
        name: "Morphos API",
        role: "Hittar de listade marknader på Morpho där din plånbok lånar, för översikten för Morpho, och talar om för vår server om en marknad är listad när du sparar ett larm för Morpho.",
        receives: "Din plånboksadress, och din IP-adress för de uppslag som din webbläsare gör.",
      },
      {
        name: "WalletConnect",
        role: "Förmedlar anslutningen mellan den här webbplatsen och din plånboksapp, om du ansluter med WalletConnect.",
        receives:
          "Det som din plånboksapp och den här webbplatsen utbyter för att ansluta, till exempel din plånboksadress.",
      },
    ],
    receives: receives => `Tar emot: ${receives}`,
    ownPolicy: "Var och en av tjänsterna hanterar uppgifterna enligt sin egen integritetspolicy.",
  },
  onChain: {
    title: "Vad som är offentligt på blockkedjan",
    text: paymentChainName =>
      `Betalningen för larm sker på ${paymentChainName ?? "betalningsnätverket"}. Varje betalning registrerar den betalande adressen, token, beloppet, tidpunkten, den köpta perioden och det nya utgångsdatumet i en offentlig händelse som vem som helst kan läsa och ingen kan radera. Dina larminställningar skrivs aldrig till en blockkedja.`,
  },
  retention: {
    title: "Hur länge vi sparar det och hur du raderar det",
    settings:
      "Larminställningarna finns kvar tills du tar bort larmet i översikten. Att ta bort det raderar inställningarna för det nätverket, inklusive e-postadressen och användarnamnet på Signal, och kräver aktiv åtkomst.",
    telegramStop:
      "Om du skickar /stop till Tokenping-boten i Telegram kopplas din chatt bort och larmen på Telegram upphör.",
    contact: {
      before: `Om din åtkomst har gått ut, eller om du vill att ditt svar på ${ATTRIBUTION_QUESTION_SV} tas bort, skriv till oss på`,
      x: "X",
      middle: "eller i vår community på",
      telegram: "Telegram",
      or: "eller",
      signal: "Signal",
      after: "så raderar vi det.",
    },
    payments: "Betalningar på blockkedjan kan inte raderas av någon.",
  },
  homepage: { before: "Frågor om hur larmen fungerar besvaras på ", link: "startsidan", after: "." },
};
