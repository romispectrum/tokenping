import type { PrivacyMessages } from "./shared";

const ATTRIBUTION_QUESTION_CS = "„Jak jste se o Tokenpingu dozvěděli?“";

export const MESSAGES: PrivacyMessages = {
  metaTitle: "Ochrana soukromí a data",
  metaDescription:
    "Co Tokenping ukládá, když si nastavíte upozornění na Aave health factor, co neukládá, které služby s vašimi daty pracují a jak je smazat.",
  crumbHome: "Úvod",
  crumbPrivacy: "Ochrana soukromí",
  title: "Ochrana soukromí: co Tokenping ukládá a kdo s daty pracuje",
  lastUpdated: "Naposledy aktualizováno",
  intro:
    "Tato stránka popisuje, co aplikace dělá dnes. Tokenping je v betaverzi a když se změní, co shromažďujeme, tuto stránku aktualizujeme.",
  withoutUs: {
    title: "Co můžete dělat, aniž byste nám cokoli poskytli",
    text: "Čtení webu a blogu ani prohlížení vašich pozic v přehledu do naší databáze nic nepřidá. Aby se vaše pozice mohly zobrazit, váš prohlížeč se ptá poskytovatelů RPC (jsou uvedeni níže) na data vaší peněženky na Aave, takže tito poskytovatelé vidí adresu vaší peněženky.",
    morpho:
      "Na přehledu Morpho váš prohlížeč navíc posílá adresu vaší peněženky do API Morpho, které najde trhy Morpho, ve kterých si půjčujete, a vaše pozice na Morpho čte od stejných poskytovatelů RPC.",
  },
  stored: {
    title: "Co ukládáme, když uložíte upozornění",
    items: [
      "Adresu vaší peněženky.",
      "Síť, pro kterou upozornění platí, a váš práh.",
      "Kanály, které jste zvolili, a jazyk každého z nich.",
      "Vaši e-mailovou adresu, pokud jste zvolili e-mail.",
      "Vaše uživatelské jméno na Signalu, pokud jste zvolili Signal.",
      "Kdy bylo upozornění vytvořeno a kdy naposledy změněno.",
      "Kdy jste naposledy poslali testovací zprávu na jednotlivý kanál, aby šel poslat jeden test na kanál za 15 minut.",
    ],
    telegram:
      "Pokud zvolíte Telegram, ukládáme uživatelské jméno na Telegramu, které zadáte do upozornění. Když tento účet stiskne Start v botovi Tokenpingu, uložíme také ID jeho chatu a čas, kdy Start stiskl, aby k němu upozornění mohla chodit. Kdokoli si může ověřit, jestli dané uživatelské jméno na Telegramu stisklo Start v botovi.",
    attribution: `Pokud po uložení upozornění odpovíte na nepovinnou otázku ${ATTRIBUTION_QUESTION_CS}, uložíme vaši odpověď a čas spolu s adresou vaší peněženky.`,
  },
  notStored: {
    title: "Co neukládáme",
    items: [
      "Vaše pozice ani historii vašeho health factoru. Čtou se živě a neukládají se.",
      "Záznam odeslaných upozornění.",
      `Sledovací pixely ani reklamní cookies: web nic z toho nepoužívá. Když se přihlásíte peněženkou, Tokenping nastaví jednu cookie, která říká jen to, která peněženka se přihlásila; platí 7 dní nebo do chvíle, kdy peněženku na tomto webu odpojíte. Během přihlašování drží druhá cookie na pět minut žádost o přihlášení. Váš prohlížeč si ve svém vlastním místním úložišti (local storage) uchovává zvolený motiv, připojení peněženky, které peněženky se v něm přihlásily, a to, zda vám už zobrazil otázku ${ATTRIBUTION_QUESTION_CS}.`,
      "IP adresy v naší databázi. Každý požadavek přesto zpracovává Vercel, jak je uvedeno níže. Když kontrola upozornění nebo odeslání zprávy selže, chyba, která může obsahovat adresu vaší peněženky a příjemce, se zapíše do našich serverových logů.",
    ],
  },
  whoCanSee: {
    title: "Kdo vidí nastavení vašich upozornění",
    tiedToWallet:
      "Nastavení upozornění je svázané s adresou peněženky, ne s účtem s heslem. Abyste je mohli zobrazit nebo změnit, podepíšete touto peněženkou zprávu, která prokáže, že adresa patří vám. Nejde o transakci, takže neplatíte žádný gas, a jeden podpis v daném prohlížeči platí 7 dní.",
    anyone: hasTelegram =>
      `E-mailovou adresu${hasTelegram ? ", uživatelské jméno na Signalu a uživatelské jméno na Telegramu" : " a uživatelské jméno na Signalu"}, které jsou k vaší peněžence uložené, si může zobrazit a její upozornění změnit nebo smazat jen ten, kdo umí podepisovat vaší peněženkou. Veřejné záznamy o platbách popsané níže přesto ukazují, které peněženky zaplatily.`,
    dontEnter:
      "Nezadávejte e-mailovou adresu ani uživatelské jméno na Signalu, které nechcete mít spojené s adresou své peněženky.",
  },
  processors: {
    title: "Kdo s vašimi daty pracuje",
    list: ({ minutes, hasTelegram }) => [
      {
        name: "Vercel",
        role: `Hostuje tento web a každých ${minutes} minut spouští kontrolu upozornění.`,
        receives: "Každý požadavek na web včetně vaší IP adresy a naše serverové logy.",
      },
      {
        name: "Vercel Web Analytics",
        role: "Počítá zobrazení stránek, bez cookies.",
        receives:
          "U každého zobrazení stránky: adresu stránky, web, ze kterého jste přišli, vaši přibližnou polohu a váš prohlížeč, operační systém a typ zařízení. Návštěvník je otisk (hash) požadavku, který se každých 24 hodin mění, takže návštěvy nelze propojit mezi dny ani weby.",
      },
      { name: "Supabase", role: "Naše databáze.", receives: "Nastavení upozornění uvedená výše." },
      { name: "Resend", role: "Odesílá upozornění e-mailem.", receives: "Vaše e-mailová adresa a text upozornění." },
      {
        name: "Fly.io (náš přenosový server pro Signal)",
        role: "Hostuje server signal-cli-rest-api, který provozujeme a který předává upozornění na Signal službě Signal.",
        receives: "Vaše uživatelské jméno na Signalu a text upozornění (ty dostává i Signal).",
      },
      ...(hasTelegram
        ? [
            {
              name: "Telegram",
              role: "Doručuje upozornění na Telegram přes své Bot API.",
              receives: "ID vašeho chatu na Telegramu a text upozornění.",
            },
          ]
        : []),
      {
        name: "Poskytovatelé RPC (PublicNode, Alchemy a veřejné endpointy jednotlivých sítí)",
        role: "Odpovídají na čtení z blockchainu: z vašeho prohlížeče pro přehled a z našeho serveru pro kontroly upozornění a pro ověření podpisu při přihlášení chytrou peněženkou.",
        receives:
          "Adresa čtené peněženky (a při přihlášení váš podpis) a u čtení z vašeho prohlížeče také vaše IP adresa.",
      },
      {
        name: "API Morpho",
        role: "Pro přehled Morpho zjišťuje, ve kterých trzích uvedených v aplikaci Morpho si vaše peněženka půjčuje, a našemu serveru při uložení upozornění na Morpho říká, zda je trh uvedený.",
        receives: "Adresa vaší peněženky a u dotazů z vašeho prohlížeče také vaše IP adresa.",
      },
      {
        name: "WalletConnect",
        role: "Zprostředkovává spojení mezi tímto webem a aplikací vaší peněženky, pokud se připojujete přes WalletConnect.",
        receives:
          "To, co si aplikace vaší peněženky a tento web při připojení vyměňují, například adresa vaší peněženky.",
      },
    ],
    receives: receives => `Předávaná data: ${receives}`,
    ownPolicy: "Každá z těchto služeb s těmito daty zachází podle svých vlastních zásad ochrany osobních údajů.",
  },
  onChain: {
    title: "Co je na blockchainu veřejné",
    text: paymentChainName =>
      `Platba za upozornění probíhá ${paymentChainName ? `na síti ${paymentChainName}` : "na platební síti"}. Každá platba zaznamená adresu plátce, token, částku, čas, zakoupené období a nové datum vypršení do veřejné události, kterou si může přečíst kdokoli a nikdo ji nemůže smazat. Nastavení vašich upozornění se na blockchain nikdy nezapisuje.`,
  },
  retention: {
    title: "Jak dlouho data uchováváme a jak je smazat",
    settings:
      "Nastavení upozornění zůstává uložené, dokud upozornění v přehledu nesmažete. Smazání odstraní nastavení pro danou síť včetně e-mailové adresy a uživatelského jména na Signalu a vyžaduje aktivní přístup.",
    telegramStop:
      "Když botovi Tokenping na Telegramu pošlete /stop, váš chat se odpojí a upozornění na Telegram přestanou chodit.",
    contact: {
      before: `Pokud vám vypršel přístup nebo chcete odstranit svou odpověď na otázku ${ATTRIBUTION_QUESTION_CS}, napište nám na`,
      x: "X",
      middle: "nebo do naší komunity na",
      telegram: "Telegramu",
      or: "či",
      signal: "Signalu",
      after: "a smažeme to.",
    },
    payments: "Platby na blockchainu nemůže smazat nikdo.",
  },
  homepage: {
    before: "Odpovědi na otázky, jak upozornění fungují, najdete na ",
    link: "úvodní stránce",
    after: ".",
  },
};
