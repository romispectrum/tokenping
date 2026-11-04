import type { PrivacyMessages } from "./shared";
import { huOnMarket } from "~~/i18n/format";

const ATTRIBUTION_QUESTION_HU = "„Honnan hallottál a Tokenpingről?”";

export const MESSAGES: PrivacyMessages = {
  metaTitle: "Adatvédelem és adatok",
  metaDescription:
    "Mit tárol a Tokenping, amikor Aave health factor-riasztást állítasz be, mit nem tárol, mely szolgáltatások kezelik az adataidat, és hogyan törölheted őket.",
  crumbHome: "Főoldal",
  crumbPrivacy: "Adatvédelem",
  title: "Adatvédelem: mit tárol a Tokenping, és ki kezeli",
  lastUpdated: "Utolsó frissítés:",
  intro:
    "Ez az oldal azt írja le, mit csinál az alkalmazás ma. A Tokenping béta állapotban van, és ha változik, hogy mit gyűjtünk, frissítjük ezt az oldalt.",
  withoutUs: {
    title: "Amit úgy is megtehetsz, hogy semmit nem adsz meg nekünk",
    text: "Az oldal és a blog olvasása, valamint a pozícióid megtekintése az irányítópulton semmit nem ad hozzá az adatbázisunkhoz. A pozícióid megjelenítéséhez a böngésződ RPC-szolgáltatóktól (lásd lent) kéri le a tárcád Aave-adatait, így ők látják a tárcacímedet.",
    morpho:
      "A Morpho irányítópulton a böngésződ a tárcacímedet a Morpho API-nak is elküldi, amely megkeresi azokat a Morpho-piacokat, amelyeken hitelt vettél fel, majd ugyanazoktól az RPC-szolgáltatóktól olvassa ki a Morpho-pozícióidat.",
  },
  stored: {
    title: "Amit egy riasztás mentésekor tárolunk",
    items: [
      "A tárcacímedet.",
      "A hálózatot, amelyre a riasztás vonatkozik, és a küszöbértékedet.",
      "A kiválasztott csatornákat és mindegyik nyelvét.",
      "Az e-mail-címedet, ha az e-mailt választottad.",
      "A Signal-felhasználónevedet, ha a Signalt választottad.",
      "A riasztás létrehozásának és utolsó módosításának idejét.",
      "Azt, hogy mikor küldtél utoljára tesztüzenetet az egyes csatornákon, hogy csatornánként 15 percenként egy teszt legyen lehetséges.",
    ],
    telegram:
      "Ha a Telegramot választod, tároljuk a riasztásba beírt Telegram-felhasználónevet. Amikor ez a fiók megnyomja a Start gombot a Tokenping botban, a csevegés azonosítóját (chat ID) és a Start megnyomásának idejét is tároljuk, hogy a riasztások eljussanak hozzá. Bárki ellenőrizheti, hogy egy Telegram-felhasználónév megnyomta-e a Start gombot a botban.",
    attribution: `Ha egy riasztás mentése után válaszolsz a nem kötelező ${ATTRIBUTION_QUESTION_HU} kérdésre, a válaszodat és az idejét a tárcacímeddel együtt tároljuk.`,
  },
  notStored: {
    title: "Amit nem tárolunk",
    items: [
      "A pozícióidat vagy a health factorod előzményeit. Ezeket élőben olvassuk ki, és nem mentjük.",
      "Az elküldött riasztások naplóját.",
      `Követőpixeleket vagy hirdetési sütiket: az oldal egyiket sem használja. Amikor bejelentkezel a tárcáddal, a Tokenping beállít egy sütit, amely csak azt rögzíti, melyik tárca jelentkezett be; 7 napig érvényes, vagy amíg le nem választod a tárcát ezen az oldalon. A bejelentkezés közben egy második süti öt percig tárolja a bejelentkezési kérést. A böngésződ a saját helyi tárhelyén tartja a témaválasztásodat, a tárcakapcsolatodat, azt, hogy mely tárcák jelentkeztek be rajta, és azt, hogy megjelenítette-e már neked a ${ATTRIBUTION_QUESTION_HU} kérdést.`,
      "IP-címeket az adatbázisunkban. A Vercel ettől még minden kérést kezel, ahogy lent szerepel. Ha egy riasztás-ellenőrzés vagy egy üzenet sikertelen, a hiba, amely tartalmazhatja a tárcacímedet és a címzettet, a szervernaplóinkba kerül.",
    ],
  },
  whoCanSee: {
    title: "Ki láthatja a riasztási beállításaidat",
    tiedToWallet:
      "A riasztási beállítások egy tárcacímhez kötődnek, nem jelszóval védett fiókhoz. A megtekintésükhöz vagy módosításukhoz azzal a tárcával aláírsz egy üzenetet, amely igazolja, hogy a cím a tiéd. Ez nem tranzakció, gas díjat sem fizetsz érte, és egy aláírás 7 napig érvényes abban a böngészőben.",
    anyone: hasTelegram =>
      `Csak az láthatja a tárcához mentett e-mail-címet${hasTelegram ? ", Signal-felhasználónevet és Telegram-felhasználónevet" : " és Signal-felhasználónevet"}, illetve módosíthatja vagy törölheti a riasztásait, aki tud aláírni a tárcáddal. Az alább leírt nyilvános fizetési adatokból viszont továbbra is látszik, mely tárcák fizettek.`,
    dontEnter:
      "Ne adj meg olyan e-mail-címet vagy Signal-felhasználónevet, amelyet nem szeretnél a tárcacímedhez kapcsolva látni.",
  },
  processors: {
    title: "Ki kezeli az adataidat",
    list: ({ minutes, hasTelegram }) => [
      {
        name: "Vercel",
        role: `Ez tárolja az oldalt, és ${minutes} percenként ez futtatja a riasztás-ellenőrzést.`,
        receives: "Az oldalra érkező összes kérést, az IP-címedet is beleértve, valamint a szervernaplóinkat.",
      },
      {
        name: "Vercel Web Analytics",
        role: "Sütik nélkül számolja az oldalmegtekintéseket.",
        receives:
          "Minden oldalmegtekintésnél: az oldal címét, az oldalt, ahonnan érkeztél, a hozzávetőleges helyedet, valamint a böngésződet, az operációs rendszeredet és az eszközöd típusát. A látogatót a kérés egy 24 óránként változó hash-e azonosítja, így a látogatások nem kapcsolhatók össze napok vagy oldalak között.",
      },
      { name: "Supabase", role: "Az adatbázisunk.", receives: "A fent felsorolt riasztási beállításokat." },
      {
        name: "Resend",
        role: "Elküldi a riasztási e-maileket.",
        receives: "Az e-mail-címedet és a riasztás szövegét.",
      },
      {
        name: "Fly.io (a Signal-továbbítónk)",
        role: "Ez tárolja az általunk futtatott signal-cli-rest-api szervert, amely átadja a Signal-riasztásokat a Signalnak.",
        receives: "A Signal-felhasználónevedet és a riasztás szövegét (ahogy a Signal is).",
      },
      ...(hasTelegram
        ? [
            {
              name: "Telegram",
              role: "A Telegram Bot API segítségével kézbesíti a Telegram-riasztásokat.",
              receives: "A Telegram-csevegésed azonosítóját (chat ID) és a riasztás szövegét.",
            },
          ]
        : []),
      {
        name: "RPC-szolgáltatók (PublicNode, Alchemy és a hálózatok nyilvános végpontjai)",
        role: "Ők válaszolnak a blokklánc-lekérdezésekre: a böngésződből az irányítópulthoz, a szerverünkről pedig a riasztás-ellenőrzésekhez és az okostárcák bejelentkezési aláírásainak ellenőrzéséhez.",
        receives:
          "A lekérdezett tárcacímet (bejelentkezéskor az aláírásodat is), a böngésződből indított lekérdezéseknél pedig az IP-címedet.",
      },
      {
        name: "A Morpho API",
        role: "A Morpho irányítópulthoz megkeresi azokat a listázott Morpho-piacokat, amelyeken a tárcád hitelt vett fel, és Morpho-riasztás mentésekor megmondja a szerverünknek, hogy egy piac listázott-e.",
        receives: "A tárcacímedet, a böngésződ által indított lekérdezéseknél pedig az IP-címedet.",
      },
      {
        name: "WalletConnect",
        role: "Továbbítja a kapcsolatot ez az oldal és a tárcaalkalmazásod között, ha WalletConnecttel csatlakozol.",
        receives: "Amit a tárcaalkalmazásod és ez az oldal a kapcsolódáshoz kicserél, például a tárcacímedet.",
      },
    ],
    receives: receives => `Ezt kapja: ${receives}`,
    ownPolicy: "Mindegyik szolgáltatás a saját adatvédelmi szabályzata szerint kezeli ezeket az adatokat.",
  },
  onChain: {
    title: "Mi nyilvános a blokkláncon",
    text: paymentChainName =>
      `A riasztásokért ${paymentChainName ? huOnMarket(paymentChainName, "network") : "a fizetési hálózaton"} fizetsz. Minden fizetés egy nyilvános eseményben rögzíti a fizető címet, a tokent, az összeget, az időpontot, a megvásárolt időszakot és az új lejárati dátumot; ezt bárki elolvashatja, és senki sem törölheti. A riasztási beállításaid soha nem kerülnek blokkláncra.`,
  },
  retention: {
    title: "Meddig őrizzük meg, és hogyan törölheted",
    settings:
      "A riasztási beállítások addig maradnak meg, amíg nem törlöd a riasztást az irányítópulton. A törlés eltávolítja az adott hálózat beállításait, az e-mail-címmel és a Signal-felhasználónévvel együtt, és aktív hozzáférést igényel.",
    telegramStop:
      "Ha a Telegramban elküldöd a /stop parancsot a Tokenping botnak, leválasztjuk a csevegésedet, és leállnak a Telegram-riasztások.",
    contact: {
      before: `Ha lejárt a hozzáférésed, vagy szeretnéd, hogy töröljük a ${ATTRIBUTION_QUESTION_HU} kérdésre adott válaszodat, akkor egy üzenet az`,
      x: "X-en",
      middle: "vagy a közösségünkben a",
      telegram: "Telegramon",
      or: "vagy a",
      signal: "Signalon",
      after: "elég ahhoz, hogy töröljük.",
    },
    payments: "A blokkláncon lévő fizetéseket senki sem törölheti.",
  },
  homepage: { before: "A riasztások működésével kapcsolatos kérdésekre a ", link: "főoldalon", after: " válaszolunk." },
};
