import type { PrivacyMessages } from "./shared";

const ATTRIBUTION_QUESTION_DE = "„Wie hast du von Tokenping erfahren?“";

export const MESSAGES: PrivacyMessages = {
  metaTitle: "Datenschutz und Daten",
  metaDescription:
    "Was Tokenping speichert, wenn du einen Health-Factor-Alert für Aave einrichtest, was nicht, welche Dienste deine Daten verarbeiten und wie du sie löschst.",
  crumbHome: "Startseite",
  crumbPrivacy: "Datenschutz",
  title: "Datenschutz: was Tokenping speichert und wer es verarbeitet",
  lastUpdated: "Zuletzt aktualisiert am",
  intro:
    "Diese Seite beschreibt, was die App heute tut. Tokenping ist in der Beta, und wir aktualisieren diese Seite, wenn sich ändert, was wir erfassen.",
  withoutUs: {
    title: "Was du tun kannst, ohne uns etwas zu geben",
    text: "Die Website und den Blog zu lesen und deine Positionen im Dashboard anzusehen, fügt unserer Datenbank nichts hinzu. Um deine Positionen anzuzeigen, fragt dein Browser RPC-Anbieter (unten aufgeführt) nach den Aave-Daten deiner Wallet, daher sehen sie deine Wallet-Adresse.",
    morpho:
      "Im Morpho-Dashboard sendet dein Browser deine Wallet-Adresse außerdem an die API von Morpho, die die Morpho-Märkte findet, in denen du leihst, und liest deine Morpho-Positionen über dieselben RPC-Anbieter.",
  },
  stored: {
    title: "Was wir speichern, wenn du einen Alert speicherst",
    items: [
      "Deine Wallet-Adresse.",
      "Das Netzwerk, für das der Alert gilt, und dein Schwellenwert.",
      "Die Kanäle, die du gewählt hast, und die Sprache jedes Kanals.",
      "Deine E-Mail-Adresse, wenn du E-Mail gewählt hast.",
      "Dein Signal-Benutzername, wenn du Signal gewählt hast.",
      "Wann der Alert erstellt und wann er zuletzt geändert wurde.",
      "Wann du zuletzt über jeden Kanal eine Testnachricht gesendet hast, um einen Test pro Kanal alle 15 Minuten zu erlauben.",
    ],
    telegram:
      "Wenn du Telegram wählst, speichern wir den Telegram-Benutzernamen, den du im Alert eingibst. Wenn dieses Konto im Tokenping-Bot auf Start drückt, speichern wir außerdem seine Chat-ID und den Zeitpunkt, zu dem es auf Start gedrückt hat, damit Alerts es erreichen können. Jeder kann prüfen, ob ein Telegram-Benutzername im Bot auf Start gedrückt hat.",
    attribution: `Wenn du nach dem Speichern eines Alerts die freiwillige Frage ${ATTRIBUTION_QUESTION_DE} beantwortest, speichern wir deine Antwort und den Zeitpunkt zusammen mit deiner Wallet-Adresse.`,
  },
  notStored: {
    title: "Was wir nicht speichern",
    items: [
      "Deine Positionen oder ein Verlauf deines Health Factors. Sie werden live gelesen und nicht gespeichert.",
      "Ein Protokoll der Alerts, die wir gesendet haben.",
      `Tracking-Pixel oder Werbe-Cookies: Die Website verwendet keine. Wenn du dich mit deiner Wallet anmeldest, setzt Tokenping ein Cookie, das nur angibt, welche Wallet sich angemeldet hat; es gilt 7 Tage oder bis du die Wallet auf dieser Website trennst. Während du dich anmeldest, hält ein zweites Cookie die Anmeldeanfrage fünf Minuten lang. Dein Browser speichert in seinem eigenen lokalen Speicher (local storage) dein gewähltes Farbschema, deine Wallet-Verbindung, welche Wallets sich in ihm angemeldet haben und ob er dir die Frage ${ATTRIBUTION_QUESTION_DE} schon gezeigt hat.`,
      "IP-Adressen in unserer Datenbank. Vercel verarbeitet trotzdem jede Anfrage, wie unten aufgeführt. Wenn eine Alert-Prüfung oder eine Nachricht fehlschlägt, landet der Fehler, der deine Wallet-Adresse und den Empfänger enthalten kann, in unseren Server-Logs.",
    ],
  },
  whoCanSee: {
    title: "Wer deine Alert-Einstellungen sehen kann",
    tiedToWallet:
      "Alert-Einstellungen sind an eine Wallet-Adresse gebunden, nicht an ein Konto mit Passwort. Um sie zu sehen oder zu ändern, signierst du mit dieser Wallet eine Nachricht, die beweist, dass die Adresse dir gehört. Das ist keine Transaktion und kostet kein Gas, und eine Signatur gilt 7 Tage in diesem Browser.",
    anyone: hasTelegram =>
      `Nur wer mit deiner Wallet signieren kann, kann die für sie gespeicherte E-Mail-Adresse${hasTelegram ? ", den Signal-Benutzernamen und den Telegram-Benutzernamen" : " und den Signal-Benutzernamen"} sehen oder ihre Alerts ändern oder löschen. Die unten beschriebenen öffentlichen Zahlungsdaten zeigen trotzdem, welche Wallets bezahlt haben.`,
    dontEnter:
      "Gib keine E-Mail-Adresse und keinen Signal-Benutzernamen ein, die du nicht mit deiner Wallet-Adresse verknüpft sehen willst.",
  },
  processors: {
    title: "Wer deine Daten verarbeitet",
    list: ({ minutes, hasTelegram }) => [
      {
        name: "Vercel",
        role: `Hostet diese Website und führt alle ${minutes} Minuten die Alert-Prüfung aus.`,
        receives: "Jede Anfrage an die Website, einschließlich deiner IP-Adresse, und unsere Server-Logs.",
      },
      {
        name: "Vercel Web Analytics",
        role: "Zählt Seitenaufrufe, ohne Cookies.",
        receives:
          "Für jeden Seitenaufruf: die Adresse der Seite, die Website, von der du kommst, deinen ungefähren Standort sowie deinen Browser, dein Betriebssystem und deinen Gerätetyp. Ein Besucher ist ein Hash der Anfrage, der sich alle 24 Stunden ändert, sodass Besuche nicht über Tage oder Websites hinweg verknüpft werden können.",
      },
      { name: "Supabase", role: "Unsere Datenbank.", receives: "Die oben aufgeführten Alert-Einstellungen." },
      { name: "Resend", role: "Versendet Alert-E-Mails.", receives: "Deine E-Mail-Adresse und den Text des Alerts." },
      {
        name: "Fly.io (unser Signal-Relay)",
        role: "Hostet den von uns betriebenen signal-cli-rest-api-Server, der Signal-Alerts an Signal übergibt.",
        receives: "Deinen Signal-Benutzernamen und den Text des Alerts (ebenso wie Signal).",
      },
      ...(hasTelegram
        ? [
            {
              name: "Telegram",
              role: "Stellt Telegram-Alerts über seine Bot API zu.",
              receives: "Deine Telegram-Chat-ID und den Text des Alerts.",
            },
          ]
        : []),
      {
        name: "RPC-Anbieter (PublicNode, Alchemy und die öffentlichen Endpunkte der Netzwerke)",
        role: "Beantworten die Abfragen an die Blockchain: aus deinem Browser für das Dashboard und von unserem Server für Alert-Prüfungen und zur Prüfung von Anmeldesignaturen von Smart Wallets.",
        receives:
          "Die abgefragte Wallet-Adresse (und bei der Anmeldung deine Signatur) sowie deine IP-Adresse bei Abfragen aus deinem Browser.",
      },
      {
        name: "API von Morpho",
        role: "Findet für das Morpho-Dashboard die gelisteten Morpho-Märkte, in denen deine Wallet leiht, und teilt unserem Server mit, ob ein Markt gelistet ist, wenn du einen Morpho-Alert speicherst.",
        receives: "Deine Wallet-Adresse sowie deine IP-Adresse bei den Abfragen, die dein Browser macht.",
      },
      {
        name: "WalletConnect",
        role: "Leitet die Verbindung zwischen dieser Website und deiner Wallet-App weiter, wenn du dich mit WalletConnect verbindest.",
        receives:
          "Was deine Wallet-App und diese Website austauschen, um sich zu verbinden, etwa deine Wallet-Adresse.",
      },
    ],
    receives: receives => `Erhält: ${receives}`,
    ownPolicy: "Jeder dieser Dienste verarbeitet diese Daten nach seiner eigenen Datenschutzerklärung.",
  },
  onChain: {
    title: "Was auf der Blockchain öffentlich ist",
    text: paymentChainName =>
      `Die Zahlung für Alerts erfolgt ${paymentChainName ? `im Netzwerk ${paymentChainName}` : "im Zahlungsnetzwerk"}. Jede Zahlung hält die zahlende Adresse, den Token, den Betrag, den Zeitpunkt, den gekauften Zeitraum und das neue Ablaufdatum in einem öffentlichen Event fest, das jeder lesen und niemand löschen kann. Deine Alert-Einstellungen werden nie auf eine Blockchain geschrieben.`,
  },
  retention: {
    title: "Wie lange wir sie aufbewahren und wie du sie löschst",
    settings:
      "Alert-Einstellungen bleiben gespeichert, bis du den Alert im Dashboard löschst. Das Löschen entfernt die Einstellungen für dieses Netzwerk, einschließlich E-Mail-Adresse und Signal-Benutzername, und setzt aktiven Zugang voraus.",
    telegramStop:
      "Wenn du /stop an den Tokenping-Bot in Telegram sendest, wird die Verknüpfung mit deinem Chat aufgehoben und Telegram-Alerts werden beendet.",
    contact: {
      before: `Wenn dein Zugang abgelaufen ist oder du deine Antwort auf die Frage ${ATTRIBUTION_QUESTION_DE} entfernen lassen willst, schreib uns auf`,
      x: "X",
      middle: "oder in unserer Community auf",
      telegram: "Telegram",
      or: "oder",
      signal: "Signal",
      after: "und wir löschen sie.",
    },
    payments: "Zahlungen auf der Blockchain kann niemand löschen.",
  },
  homepage: {
    before: "Fragen dazu, wie Alerts funktionieren, beantwortet die ",
    link: "Startseite",
    after: ".",
  },
};
