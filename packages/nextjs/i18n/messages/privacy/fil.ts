import type { PrivacyMessages } from "./shared";

const ATTRIBUTION_QUESTION_FIL = "“Paano mo nalaman ang Tokenping?”";

export const MESSAGES: PrivacyMessages = {
  metaTitle: "Privacy at data",
  metaDescription:
    "Ano ang iniimbak ng Tokenping kapag nag-set ka ng Aave health factor alert, ano ang hindi, aling serbisyo ang humahawak ng data mo at paano ito i-delete.",
  crumbHome: "Home",
  crumbPrivacy: "Privacy",
  title: "Privacy: ano ang iniimbak ng Tokenping at sino ang humahawak nito",
  lastUpdated: "Huling na-update",
  intro:
    "Inilalarawan ng page na ito ang ginagawa ng app sa kasalukuyan. Nasa beta ang Tokenping, at ina-update namin ang page na ito kapag nagbago ang kinokolekta namin.",
  withoutUs: {
    title: "Ang magagawa mo nang hindi nagbibigay sa amin ng kahit ano",
    text: "Ang pagbasa sa site at sa blog, at ang pagtingin sa mga posisyon mo sa dashboard, ay walang idinadagdag sa database namin. Para maipakita ang mga posisyon mo, hinihingi ng browser mo sa mga RPC provider (nakalista sa ibaba) ang Aave data ng wallet mo, kaya nakikita nila ang wallet address mo.",
    morpho:
      "Sa Morpho dashboard, ipinapadala rin ng browser mo ang wallet address mo sa API ng Morpho, na naghahanap ng mga Morpho market kung saan ka nagbo-borrow, at binabasa nito ang mga posisyon mo sa Morpho mula sa parehong mga RPC provider.",
  },
  stored: {
    title: "Ang iniimbak namin kapag nag-save ka ng alerto",
    items: [
      "Ang wallet address mo.",
      "Ang network na para sa alerto, at ang threshold mo.",
      "Ang mga channel na pinili mo, at ang wika ng bawat isa.",
      "Ang email address mo, kung pinili mo ang email.",
      "Ang Signal username mo, kung pinili mo ang Signal.",
      "Kailan ginawa ang alerto at kailan ito huling binago.",
      "Kailan ka huling nagpadala ng test na mensahe sa bawat channel, para payagan ang isang test kada channel bawat 15 minuto.",
    ],
    telegram:
      "Kung pinili mo ang Telegram, iniimbak namin ang Telegram username na tina-type mo sa alerto. Kapag pinindot ng account na iyon ang Start sa Tokenping bot, iniimbak din namin ang chat ID nito at kung kailan nito pinindot ang Start, para maabot ito ng mga alerto. Kahit sino ay puwedeng tumingin kung napindot na ng isang Telegram username ang Start sa bot.",
    attribution: `Kung sasagutin mo ang opsyonal na tanong na ${ATTRIBUTION_QUESTION_FIL} pagkatapos mag-save ng alerto, iniimbak namin ang sagot mo at ang oras kasama ng wallet address mo.`,
  },
  notStored: {
    title: "Ang hindi namin iniimbak",
    items: [
      "Ang mga posisyon mo o ang history ng health factor mo. Binabasa ang mga ito nang live at hindi sine-save.",
      "Isang log ng mga alertong ipinadala namin.",
      `Mga tracking pixel o advertising cookie: wala ni isa ang ginagamit ng site. Kapag nag-sign in ka gamit ang wallet mo, naglalagay ang Tokenping ng isang cookie na nagsasabi lang kung aling wallet ang nag-sign in; tumatagal ito nang 7 araw o hanggang i-disconnect mo ang wallet sa site na ito. Habang nagsa-sign in ka, may pangalawang cookie na naglalaman ng sign-in request sa loob ng limang minuto. Itinatabi ng browser mo sa sarili nitong local storage ang napili mong tema, ang koneksyon ng wallet mo, kung aling mga wallet ang nag-sign in dito at kung naipakita na nito sa iyo ang tanong na ${ATTRIBUTION_QUESTION_FIL}.`,
      "Mga IP address sa database namin. Hinahawakan pa rin ng Vercel ang bawat request, gaya ng nakalista sa ibaba. Kapag pumalya ang pagtingin sa isang alerto o ang isang mensahe, napupunta sa server logs namin ang error, na puwedeng maglaman ng wallet address mo at ng tatanggap.",
    ],
  },
  whoCanSee: {
    title: "Sino ang nakakakita ng mga setting ng alerto mo",
    tiedToWallet:
      "Nakatali ang mga setting ng alerto sa isang wallet address, hindi sa isang account na may password. Para makita o mabago ang mga ito, pumipirma ka ng mensahe gamit ang wallet na iyon, na nagpapatunay na sa iyo ang address. Hindi ito transaksyon at walang gas na gagastusin, at tumatagal nang 7 araw ang isang pirma sa browser na iyon.",
    anyone: hasTelegram =>
      `Ang may kakayahang pumirma gamit ang wallet mo lang ang makakakita ng email address${hasTelegram ? ", Signal username at Telegram username" : " at Signal username"} na naka-save para dito, o makakapagbago o makakapag-delete ng mga alerto nito. Ipinapakita pa rin ng mga pampublikong record ng bayad na inilalarawan sa ibaba kung aling mga wallet ang nagbayad.`,
    dontEnter: "Huwag maglagay ng email address o Signal username na ayaw mong maiugnay sa wallet address mo.",
  },
  processors: {
    title: "Sino ang humahawak ng data mo",
    list: ({ minutes, hasTelegram }) => [
      {
        name: "Vercel",
        role: `Nagho-host ng site na ito at nagpapatakbo ng pagtingin sa mga alerto bawat ${minutes} minuto.`,
        receives: "Bawat request sa site, kasama ang IP address mo, at ang server logs namin.",
      },
      {
        name: "Vercel Web Analytics",
        role: "Binibilang ang mga page view, nang walang cookie.",
        receives:
          "Para sa bawat page view: ang address ng page, ang site na pinanggalingan mo, ang tinatayang lokasyon mo, at ang browser, operating system at uri ng device mo. Ang isang bisita ay isang hash ng request na nagbabago bawat 24 oras, kaya hindi maiuugnay ang mga pagbisita sa iba't ibang araw o site.",
      },
      { name: "Supabase", role: "Ang database namin.", receives: "Ang mga setting ng alerto na nakalista sa itaas." },
      {
        name: "Resend",
        role: "Nagpapadala ng mga alerto sa email.",
        receives: "Ang email address mo at ang text ng alerto.",
      },
      {
        name: "Fly.io (ang Signal relay namin)",
        role: "Nagho-host ng signal-cli-rest-api server na pinapatakbo namin, na nagpapasa ng mga Signal alert sa Signal.",
        receives: "Ang Signal username mo at ang text ng alerto (ganoon din ang Signal).",
      },
      ...(hasTelegram
        ? [
            {
              name: "Telegram",
              role: "Naghahatid ng mga Telegram alert sa pamamagitan ng Bot API nito.",
              receives: "Ang Telegram chat ID mo at ang text ng alerto.",
            },
          ]
        : []),
      {
        name: "Mga RPC provider (PublicNode, Alchemy at ang mga public endpoint ng mga network)",
        role: "Sumasagot sa mga pagbasa sa blockchain: mula sa browser mo para sa dashboard, at mula sa server namin para sa pagtingin sa mga alerto at para i-check ang mga sign-in signature mula sa mga smart wallet.",
        receives:
          "Ang wallet address na binabasa (at, kapag nag-sign in ka, ang pirma mo), at ang IP address mo para sa mga pagbasang ginawa mula sa browser mo.",
      },
      {
        name: "API ng Morpho",
        role: "Hinahanap ang mga nakalistang Morpho market kung saan nagbo-borrow ang wallet mo, para sa Morpho dashboard, at sinasabi sa server namin kung nakalista ang isang market kapag nag-save ka ng Morpho alert.",
        receives: "Ang wallet address mo, at ang IP address mo para sa mga lookup na ginagawa ng browser mo.",
      },
      {
        name: "WalletConnect",
        role: "Ipinapasa ang koneksyon sa pagitan ng site na ito at ng wallet app mo, kung kumonekta ka gamit ang WalletConnect.",
        receives: "Ang ipinagpapalitan ng wallet app mo at ng site na ito para makakonekta, gaya ng wallet address mo.",
      },
    ],
    receives: receives => `Natatanggap: ${receives}`,
    ownPolicy: "Hinahawakan ng bawat isa sa mga serbisyong ito ang data na iyon ayon sa sarili nitong privacy policy.",
  },
  onChain: {
    title: "Ano ang public sa blockchain",
    text: paymentChainName =>
      `Ginagawa ang pagbabayad para sa mga alerto sa ${paymentChainName ?? "network ng bayad"}. Itinatala ng bawat bayad ang address na nagbayad, ang token, ang halaga, ang oras, ang biniling panahon at ang bagong expiry date sa isang pampublikong event na mababasa ng kahit sino at hindi mabubura ng kahit sino. Hindi kailanman isinusulat sa blockchain ang mga setting ng alerto mo.`,
  },
  retention: {
    title: "Gaano katagal namin ito itinatabi, at paano ito i-delete",
    settings:
      "Nananatili ang mga setting ng alerto hanggang i-delete mo ang alerto sa dashboard. Inaalis ng pag-delete ang mga setting ng network na iyon, kasama ang email address at Signal username, at kailangan nito ng aktibong access.",
    telegramStop:
      "Ang pagpapadala ng /stop sa Tokenping bot sa Telegram ay nag-a-unlink sa chat mo at nagpapatigil sa mga Telegram alert.",
    contact: {
      before: `Kung nag-expire na ang access mo, o gusto mong maalis ang sagot mo sa ${ATTRIBUTION_QUESTION_FIL}, mag-message sa amin sa`,
      x: "X",
      middle: "o sa community namin sa",
      telegram: "Telegram",
      or: "o",
      signal: "Signal",
      after: "at ide-delete namin ito.",
    },
    payments: "Walang sinumang makakapag-delete ng mga bayad sa blockchain.",
  },
  homepage: {
    before: "Nasasagot sa ",
    link: "home page",
    after: " ang mga tanong tungkol sa kung paano gumagana ang mga alerto.",
  },
};
