import type { PrivacyMessages } from "./shared";
import { plural } from "~~/i18n/format";

const ATTRIBUTION_QUESTION_IT = "«Come hai conosciuto Tokenping?»";

export const MESSAGES: PrivacyMessages = {
  metaTitle: "Privacy e dati",
  metaDescription:
    "Cosa salva Tokenping quando imposti un avviso sul fattore di salute Aave, cosa non salva, quali servizi trattano i tuoi dati e come cancellarli.",
  crumbHome: "Home",
  crumbPrivacy: "Privacy",
  title: "Privacy: cosa salva Tokenping e chi lo tratta",
  lastUpdated: "Ultimo aggiornamento:",
  intro:
    "Questa pagina descrive cosa fa l'app oggi. Tokenping è in beta e aggiorniamo questa pagina quando cambia ciò che raccogliamo.",
  withoutUs: {
    title: "Cosa puoi fare senza darci nulla",
    text: "Leggere il sito e il blog, e vedere le tue posizioni nella dashboard, non aggiunge nulla al nostro database. Per mostrarti le posizioni, il tuo browser chiede ai provider RPC (elencati più sotto) i dati Aave del tuo wallet, quindi loro vedono l'indirizzo del tuo wallet.",
    morpho:
      "Nella dashboard Morpho, il tuo browser invia anche l'indirizzo del tuo wallet all'API di Morpho, che trova i mercati Morpho in cui prendi in prestito, e legge le tue posizioni Morpho dagli stessi provider RPC.",
  },
  stored: {
    title: "Cosa salviamo quando salvi un avviso",
    items: [
      "L'indirizzo del tuo wallet.",
      "La rete a cui si riferisce l'avviso e la tua soglia.",
      "I canali che hai scelto e la lingua di ciascuno.",
      "Il tuo indirizzo email, se hai scelto l'email.",
      "Il tuo nome utente Signal, se hai scelto Signal.",
      "Quando l'avviso è stato creato e quando è stato modificato l'ultima volta.",
      "Quando hai inviato l'ultimo messaggio di prova su ogni canale, per consentire un test per canale ogni 15 minuti.",
    ],
    telegram:
      "Se scegli Telegram, salviamo il nome utente Telegram che inserisci nell'avviso. Quando quell'account preme Start nel bot di Tokenping, salviamo anche il suo chat ID e il momento in cui ha premuto Start, così gli avvisi possono raggiungerlo. Chiunque può verificare se un nome utente Telegram ha premuto Start nel bot.",
    attribution: `Se rispondi alla domanda facoltativa ${ATTRIBUTION_QUESTION_IT} dopo aver salvato un avviso, salviamo la tua risposta e l'ora insieme all'indirizzo del tuo wallet.`,
  },
  notStored: {
    title: "Cosa non salviamo",
    items: [
      "Le tue posizioni o uno storico del tuo fattore di salute. Vengono lette al momento e non salvate.",
      "Un registro degli avvisi che abbiamo inviato.",
      `Pixel di tracciamento o cookie pubblicitari: il sito non ne usa. Quando accedi con il tuo wallet, Tokenping imposta un cookie che indica solo quale wallet ha effettuato l'accesso; dura 7 giorni o finché non scolleghi il wallet su questo sito. Durante l'accesso, un secondo cookie conserva la richiesta di accesso per cinque minuti. Il tuo browser conserva nel proprio local storage la tua scelta del tema, il collegamento del tuo wallet, quali wallet vi hanno effettuato l'accesso e se ti ha già mostrato la domanda ${ATTRIBUTION_QUESTION_IT}.`,
      "Indirizzi IP nel nostro database. Vercel gestisce comunque ogni richiesta, come indicato più sotto. Quando un controllo degli avvisi o un messaggio non va a buon fine, l'errore, che può includere l'indirizzo del tuo wallet e il destinatario, finisce nei log del nostro server.",
    ],
  },
  whoCanSee: {
    title: "Chi può vedere le impostazioni dei tuoi avvisi",
    tiedToWallet:
      "Le impostazioni degli avvisi sono legate a un indirizzo di wallet, non a un account con password. Per vederle o modificarle, firmi un messaggio con quel wallet, che dimostra che l'indirizzo è tuo. Non è una transazione e non costa gas, e una firma dura 7 giorni su quel browser.",
    anyone: hasTelegram =>
      `Solo chi può firmare con il tuo wallet può vedere l'indirizzo email${hasTelegram ? ", il nome utente Signal e il nome utente Telegram" : " e il nome utente Signal"} salvati per quel wallet, o modificarne o eliminarne gli avvisi. I registri pubblici dei pagamenti descritti più sotto mostrano comunque quali wallet hanno pagato.`,
    dontEnter:
      "Non inserire un indirizzo email o un nome utente Signal che non vorresti collegati all'indirizzo del tuo wallet.",
  },
  processors: {
    title: "Chi tratta i tuoi dati",
    list: ({ minutes, hasTelegram }) => [
      {
        name: "Vercel",
        role: `Ospita questo sito ed esegue il controllo degli avvisi ${plural("it", minutes, { one: "ogni minuto", many: `ogni ${minutes} minuti`, other: `ogni ${minutes} minuti` })}.`,
        receives: "Ogni richiesta al sito, compreso il tuo indirizzo IP, e i log del nostro server.",
      },
      {
        name: "Vercel Web Analytics",
        role: "Conta le visualizzazioni di pagina, senza cookie.",
        receives:
          "Per ogni visualizzazione di pagina: l'indirizzo della pagina, il sito da cui arrivi, la tua posizione approssimativa, il tuo browser, il sistema operativo e il tipo di dispositivo. Un visitatore è un hash della richiesta che cambia ogni 24 ore, quindi le visite non possono essere collegate tra giorni o siti diversi.",
      },
      { name: "Supabase", role: "Il nostro database.", receives: "Le impostazioni degli avvisi elencate sopra." },
      { name: "Resend", role: "Invia le email di avviso.", receives: "Il tuo indirizzo email e il testo dell'avviso." },
      {
        name: "Fly.io (il nostro relay Signal)",
        role: "Ospita il server signal-cli-rest-api che gestiamo, che consegna a Signal gli avvisi Signal.",
        receives: "Il tuo nome utente Signal e il testo dell'avviso (e li riceve anche Signal).",
      },
      ...(hasTelegram
        ? [
            {
              name: "Telegram",
              role: "Consegna gli avvisi Telegram tramite la sua Bot API.",
              receives: "Il tuo chat ID Telegram e il testo dell'avviso.",
            },
          ]
        : []),
      {
        name: "Provider RPC (PublicNode, Alchemy e gli endpoint pubblici delle reti)",
        role: "Rispondono alle letture della blockchain: dal tuo browser per la dashboard, e dal nostro server per i controlli degli avvisi e per verificare le firme di accesso degli smart wallet.",
        receives:
          "L'indirizzo del wallet letto (e, quando accedi, la tua firma), e il tuo indirizzo IP per le letture fatte dal tuo browser.",
      },
      {
        name: "API di Morpho",
        role: "Trova i mercati Morpho elencati in cui il tuo wallet prende in prestito, per la dashboard Morpho, e dice al nostro server se un mercato è elencato quando salvi un avviso Morpho.",
        receives: "L'indirizzo del tuo wallet, e il tuo indirizzo IP per le ricerche fatte dal tuo browser.",
      },
      {
        name: "WalletConnect",
        role: "Inoltra il collegamento tra questo sito e la tua app wallet, se ti colleghi con WalletConnect.",
        receives:
          "Ciò che la tua app wallet e questo sito si scambiano per collegarsi, come l'indirizzo del tuo wallet.",
      },
    ],
    receives: receives => `Riceve: ${receives}`,
    ownPolicy: "Ciascuno di questi servizi tratta quei dati secondo la propria informativa sulla privacy.",
  },
  onChain: {
    title: "Cosa è pubblico sulla blockchain",
    text: paymentChainName =>
      `Il pagamento degli avvisi avviene ${paymentChainName ? `su ${paymentChainName}` : "sulla rete di pagamento"}. Ogni pagamento registra l'indirizzo che paga, il token, l'importo, l'ora, il periodo acquistato e la nuova data di scadenza in un evento pubblico che chiunque può leggere e nessuno può cancellare. Le impostazioni dei tuoi avvisi non vengono mai scritte su una blockchain.`,
  },
  retention: {
    title: "Per quanto tempo li conserviamo e come cancellarli",
    settings:
      "Le impostazioni degli avvisi restano finché non elimini l'avviso nella dashboard. L'eliminazione rimuove le impostazioni di quella rete, compresi l'indirizzo email e il nome utente Signal, e richiede l'accesso attivo.",
    telegramStop: "Inviare /stop al bot di Tokenping in Telegram scollega la tua chat e ferma gli avvisi Telegram.",
    contact: {
      before: `Se il tuo accesso è scaduto, o vuoi che la tua risposta alla domanda ${ATTRIBUTION_QUESTION_IT} venga rimossa, scrivici su`,
      x: "X",
      middle: "o nella nostra community su",
      telegram: "Telegram",
      or: "o",
      signal: "Signal",
      after: "e provvederemo alla cancellazione.",
    },
    payments: "I pagamenti sulla blockchain non possono essere cancellati da nessuno.",
  },
  homepage: {
    before: "Le domande su come funzionano gli avvisi trovano risposta nella ",
    link: "home page",
    after: ".",
  },
};
