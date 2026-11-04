import { type HomeMessages, rich } from "./shared";
import { capitalize, formatDecimal } from "~~/i18n/format";
import type { AlertPlan } from "~~/services/marketing/alertPlan";

// The alert price ("30 gün için 3 USDC" or the blog's fallback) always stands where a bare noun phrase reads:
// "Uyarıların fiyatı: ...". Names (networks, channels) stand before a noun ("Arbitrum One ağında", "Signal ve
// e-posta üzerinden") so no suffix has to follow their vowel harmony.

/** "30 gün için 3 USDC": Turkish keeps the noun singular after a number. */
const trPrice = (plan: AlertPlan) => `${plan.days} gün için ${formatDecimal("tr", plan.priceLabel)}`;

/** "Arbitrum One ağında", or the payment network unnamed. */
const trOnChain = (chainName: string | undefined) => (chainName ? `${chainName} ağında` : "ödeme ağında");

export const MESSAGES: HomeMessages = {
  headline: channels => `${channels} üzerinden Aave ve Morpho sağlık faktörü uyarıları`,
  description: ({ channels, networks, minutes, short }) =>
    short
      ? `Aave veya Morpho sağlık faktörünüz eşiğinizin altındayken ${channels} ile uyarı; ${networks} ağda, her ${minutes} dakikada bir.`
      : `Aave veya Morpho sağlık faktörünüz eşiğinizin altına düştüğünde ${channels} ile uyarı alın; ${networks} ağda. Her ${minutes} dakikada bir kontrol edilir.`,
  channelBadge: capitalize,
  pricingCta: plan => (plan ? `Uyarıları kur: ${trPrice(plan)}` : "Uyarıları kur"),
  offerDescription: ({ days, currency }) =>
    `${days} günlük sağlık faktörü uyarıları, cüzdanınızdan ${currency} ile ödenir. Otomatik yenileme yok.`,

  kicker: "Aave V3 ve V4, Morpho Blue ve Midnight",
  heroLead: ({ minutes, channels }) =>
    `Her ${minutes} dakikada bir kontrol. Eşiğinizin altında kaldığınız sürece ${channels} üzerinden mesaj. Salt okunur, token onayı yok.`,
  networksLabel: "Ağlar",
  heroCoverage: networks => `${networks} ağ`,
  channelsLabel: "Uyarı kanalları:",
  exampleAlertLabel: "Örnek bir uyarı",
  exampleAlertCaption: subject => `Örnek. E-postalar “${subject}” konusuyla gelir.`,

  dashboardCta: "Aave panelini aç",
  morphoDashboardCta: "Morpho panelini aç",
  dashboardCtaMicrocopy: alertPrice => `Cüzdan bağlayın, tüm pozisyonlarınızı görün. Uyarıların fiyatı: ${alertPrice}.`,

  problemTitle: "Siz uyurken sağlık faktörü düşer",
  problemLead: "Aave sağlık faktörünüzü gösterir ama uyarı göndermez (Ekim 2026). Gece boyunca onu üç şey değiştirir:",
  problemCauses: [
    { title: "Fiyatlar düşer", body: "ETH düşer ve teminatınızın değeri azalır." },
    { title: "Faiz birikir", body: "Borcunuz her saniye büyür." },
    { title: "Eşikler değişir", body: "Aave'de governance bir likidasyon eşiğini düşürebilir." },
  ],
  problemEvidence: ({ morning, failedRepays, polygon }) =>
    rich(
      "Borç alanlar ",
      morning("sabah likide edilmiş bir pozisyonla uyanmayı"),
      ", ",
      failedRepays("bir saat boyunca başarısız olan geri ödeme işlemlerini"),
      " ve ",
      polygon("1,01'de yapılan ama geç kalan bir geri ödemeyi"),
      " anlatıyor.",
    ),
  problemLiquidator: guide =>
    rich(
      "Likidatör üstüne bir bonus da alır: Ethereum Core piyasasında WETH için %5 (Ekim 2026).",
      guide && rich(" ", guide("Likidasyonun nasıl işlediğini okuyun"), "."),
    ),
  chart: {
    threshold: "eşiğiniz",
    liquidation: "likidasyon",
    alertSent: "Uyarı gönderildi",
    youCheck: "Telefonunuza bakarsınız",
    caption:
      "Örnek bir gece. Uyarı 03:05'te, 1,5'in altındaki ilk kontrolde gider; siz telefonunuza bakmadan beş saat önce.",
  },

  howItWorksTitle: "Nasıl çalışır",
  steps: ({ plan, paymentChain, minutes, channels, threshold, morphoMin }) => {
    const paidOn = paymentChain ? `${paymentChain} ağında ` : "";
    return [
      {
        title: "Borç aldığınız cüzdanı bağlayın",
        body: "Salt okunur. Aave ve Morpho için ayrı birer sayfa.",
      },
      {
        title: plan
          ? `Uyarıları ${formatDecimal("tr", plan.priceLabel)} karşılığında açın`
          : "Uyarıları küçük bir USDC ödemesiyle açın",
        body: `${plan ? `${plan.days} gün; ödeme` : "Ödeme"} ${paidOn}USDC ile. Otomatik yenileme yok.`,
      },
      {
        title: "Her piyasa için bir eşik seçin",
        body: `${formatDecimal("tr", threshold.min)} ile ${formatDecimal("tr", threshold.max)} arası (Morpho'da en düşük ${formatDecimal("tr", morphoMin)}), varsayılan ${formatDecimal("tr", threshold.default)}.`,
      },
      {
        title: "Eşiğin altında kaldığınız sürece mesaj alın",
        body: `Eşiğinizin üstüne dönene kadar her ${minutes} dakikada bir, ${channels} üzerinden.`,
      },
    ];
  },
  scaleTitle: "Eşiğinizi nereye koymalısınız",
  scale: {
    liquidation: "likidasyon",
    critical: "Kritik",
    risky: "Riskli",
    safe: "Güvenli",
    defaultThreshold: value => `Varsayılan ${value}`,
    below: value => `${value} altı`,
    between: (from, to) => `${from} ile ${to} arası`,
    andAbove: value => `${value} ve üstü`,
    range: (min, max) => `${min} ile ${max} arasında herhangi bir değer.`,
  },
  scaleGuide: "Eşik nasıl seçilir",

  coverageTitle: "Tüm Aave piyasaları ve listelenen tüm Morpho piyasaları",
  coverageLead: ({ v3Markets, v3Networks, spokes, v4Networks, morphoNetworks }) =>
    `4 Kasım 2026 itibarıyla ${v3Networks} ağda ${v3Markets} Aave V3 piyasası ve ${v4Networks} ağda ${spokes} Aave V4 Spoke; buna ek olarak ${morphoNetworks} ağda listelenen tüm Morpho piyasaları.`,
  coverage: {
    v3Markets: count => `${count} V3 piyasası`,
    v4Spokes: count => `${count} V4 Spoke`,
    morpho: "Morpho",
  },
  coverageNote:
    "Scroll, ZKsync, Metis, Soneium ve Sonic, Aave governance kararıyla kademeli olarak kapatılıyor ve hâlâ izleniyor. Kapsam dışı: Harmony ağında Aave V3, listelenmemiş Morpho piyasaları ve diğer protokoller.",

  pricingTitle: "Fiyat",
  pricingRows: ({ alertPrice, paymentChain }) => [
    { term: "Uyarılar", detail: capitalize(alertPrice) },
    { term: "Yenileme", detail: "Otomatik değil: daha fazla süre istediğinizde tekrar ödeyin" },
    {
      term: "Ödeme",
      detail: paymentChain
        ? `${paymentChain} ağında USDC, cüzdanınızdan (önce onay, sonra ödeme)`
        : "USDC, cüzdanınızdan",
    },
  ],
  priceSource: "Fiyat ödeme sözleşmesinden okunur ve saatte bir yenilenir.",
  pricingFootnote: "Pozisyonlarınızı görmek ödeme gerektirmez.",

  questionsTitle: "Cüzdan bağlamadan önce sorulacak sorular",
  questions: ({ alertPrice, paymentChain, hasTelegram, minutes, morphoMin, links }) => {
    const onChain = trOnChain(paymentChain);
    return [
      {
        question: "Tokenping fonlarıma dokunabilir mi?",
        answer: rich(
          `Hayır. Tokenping yalnızca pozisyonlarınızı okur; Aave veya Morpho'da hiçbir zaman onay ya da imza istemez. Tek işlemler ${onChain} yapılan ödemedir: tam fiyat tutarı için bir onay, ardından ödeme. `,
          links.sourcify
            ? rich(
                "Sözleşme ",
                links.sourcify("Sourcify'da doğrulanmıştır"),
                " ve ",
                links.sourceCode("kaynak kodu herkese açıktır"),
              )
            : links.sourceCode("Sözleşmenin kaynak kodu herkese açıktır"),
          "; ekibin cüzdanı sözleşmenin fiyatını değiştirebilir, sözleşmeyi duraklatabilir ve yükseltebilir.",
        ),
      },
      {
        question: "Neleri saklıyorsunuz?",
        answer: rich(
          "Cüzdan adresinizi, uyarılarınızı ve verdiğiniz iletişim bilgilerini (e-posta, Signal kullanıcı adı",
          hasTelegram ? ", Telegram sohbeti" : "",
          `). Geçmiş tutulmaz, izleme çerezi yoktur; sayfa görüntülemeleri anonim olarak sayılır. Bu iletişim bilgilerini yalnızca cüzdanınızla imza atabilen biri okuyabilir, ancak ${onChain} yapılan ödemeler herkese açıktır. Tam liste `,
          links.privacy("gizlilik sayfasında"),
          " yer alır.",
        ),
      },
      {
        question: "Ne kadar tutar?",
        answer: rich(
          `Uyarıların fiyatı: ${alertPrice}, ${onChain} USDC ile; gas için biraz ETH de gerekir. Pozisyonlarınızı görmek ödeme gerektirmez. Otomatik yenileme yok, iade yok.`,
        ),
      },
      {
        question: "Hangi Morpho kredileri kapsanıyor?",
        answer: rich(
          `Morpho uygulamasının listelediği piyasalardaki Morpho Blue (değişken faiz) ve Morpho Midnight (sabit faiz) kredileri, ${formatDecimal("tr", morphoMin)} değerinden başlayan eşiklerle. Sabit faizli bir kredi için vade sonundan önce hatırlatmalar da gönderilir. Aynı plan bunları da kapsar: `,
          links.morphoDashboard("Morpho panelini açın"),
          ".",
        ),
      },
      {
        question: "Bir uyarı ulaşmazsa ne olur?",
        answer: rich(
          `${minutes} dakika sonraki kontrol tekrar dener. Teslimat Resend'e, bir Signal aktarıcısına, `,
          hasTelegram ? "Telegram Bot API'ye, " : "",
          "herkese açık RPC düğümlerine ve Vercel'in zamanlayıcısına dayanır; çalışma süresi garantisi yoktur. İki kanal seçin ve harekete geçmek için kendinize zaman bırakın.",
        ),
      },
      {
        question: "Uyarıları nasıl durdururum?",
        answer: rich(
          "Sağlık faktörünüz eşiğinizin üstüne döndüğünde veya uyarıyı sildiğinizde dururlar (etkin erişim gerekir). Erişiminizin süresi mi doldu? Bize ",
          links.x("X"),
          " üzerinden ya da ",
          links.telegramCommunity("Telegram"),
          " veya ",
          links.signalCommunity("Signal"),
          " topluluğumuzda yazın.",
          hasTelegram ? " Telegram'da /stop komutu da çalışır." : "",
          " Henüz erteleme ve abonelikten çıkma bağlantısı yok.",
        ),
      },
      {
        question: "Bağlamadığım bir cüzdanı izleyebilir miyim?",
        answer: rich("Şimdilik hayır. Tek cüzdan, yani bağladığınız cüzdan; erişim cüzdan başınadır."),
      },
      {
        question: "Diğer araçlar için ödeme gerekmiyor. Neden ödemeli?",
        answer: rich(
          "Bir Telegram botu veya mobil uygulama işinizi görüyorsa onu kullanın",
          links.comparison ? rich(": ", links.comparison("karşılaştırmamız"), " bunları ele alıyor") : null,
          ". Tokenping, her Aave piyasasında ve listelenen her Morpho piyasasında Signal veya e-posta üzerinden uyarı isteyenler içindir.",
        ),
      },
    ];
  },

  limitsTitle: "Sınırlar, açıkça",
  limits: ({ minutes, paymentChain }) => [
    `Kontrol her ${minutes} dakikada bir yapılır, kesintisiz değildir.`,
    "Eşiğinizin altındaki her kontrol yeni bir mesaj gönderir: erteleme veya özet yok.",
    "Piyasa başına bir eşik, yalnızca bağlı cüzdan için.",
    `Yalnızca ${paymentChain ? `${paymentChain} ağında ` : ""}USDC: kart yok, iade yok.`,
    "E-postalarda henüz abonelikten çıkma bağlantısı yok; bir uyarıyı silmek etkin erişim gerektirir.",
    "Beta: teslimat üçüncü taraf hizmetlerle yapılır, çalışma süresi garantisi yok.",
  ],

  blogTitle: "Blogdan",
  allGuides: "Tüm Aave ve Morpho rehberleri",

  closingTitle: "Aave veya Morpho sağlık faktörü uyarınızı kurun",
  closingLead: alertPrice => `${capitalize(alertPrice)}, cüzdanınızdan ödenir. Otomatik yenileme yok.`,
};
