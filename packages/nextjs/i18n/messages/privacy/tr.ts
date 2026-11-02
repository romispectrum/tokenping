import type { PrivacyMessages } from "./shared";

const ATTRIBUTION_QUESTION_TR = "“Tokenping'i nereden duydunuz?”";

export const MESSAGES: PrivacyMessages = {
  metaTitle: "Gizlilik ve veriler",
  metaDescription:
    "Bir Aave sağlık faktörü uyarısı kurduğunuzda Tokenping'in neleri sakladığı ve saklamadığı, verilerinizi hangi hizmetlerin işlediği ve nasıl silineceği.",
  crumbHome: "Ana sayfa",
  crumbPrivacy: "Gizlilik",
  title: "Gizlilik: Tokenping neleri saklar ve kimler işler",
  lastUpdated: "Son güncelleme:",
  intro:
    "Bu sayfa, uygulamanın bugün ne yaptığını anlatır. Tokenping beta aşamasındadır ve topladığımız veriler değiştiğinde bu sayfayı güncelleriz.",
  withoutUs: {
    title: "Bize hiçbir şey vermeden yapabilecekleriniz",
    text: "Siteyi ve blogu okumak, panelde pozisyonlarınıza bakmak veritabanımıza hiçbir şey eklemez. Pozisyonlarınızı göstermek için tarayıcınız, cüzdanınızın Aave verilerini RPC sağlayıcılarından (aşağıda listelenmiştir) ister; bu yüzden bu sağlayıcılar cüzdan adresinizi görür.",
    morpho:
      "Morpho panelinde tarayıcınız ayrıca cüzdan adresinizi, borç aldığınız Morpho piyasalarını bulan Morpho API'sine gönderir ve Morpho pozisyonlarınızı aynı RPC sağlayıcılarından okur.",
  },
  stored: {
    title: "Bir uyarı kaydettiğinizde neleri saklarız",
    items: [
      "Cüzdan adresiniz.",
      "Uyarının ait olduğu ağ ve eşiğiniz.",
      "Seçtiğiniz kanallar ve her birinin dili.",
      "E-postayı seçtiyseniz e-posta adresiniz.",
      "Signal'ı seçtiyseniz Signal kullanıcı adınız.",
      "Uyarının oluşturulduğu ve en son değiştirildiği zaman.",
      "Kanal başına 15 dakikada bir test yapılabilmesi için, her kanalda en son ne zaman test mesajı gönderdiğiniz.",
    ],
    telegram:
      "Telegram'ı seçerseniz, uyarıya yazdığınız Telegram kullanıcı adını saklarız. Bu hesap Tokenping botunda Start'a bastığında, uyarıların ona ulaşabilmesi için sohbet kimliğini ve Start'a bastığı zamanı da saklarız. Bir Telegram kullanıcı adının botta Start'a basıp basmadığını herkes kontrol edebilir.",
    attribution: `Bir uyarıyı kaydettikten sonra isteğe bağlı ${ATTRIBUTION_QUESTION_TR} sorusunu yanıtlarsanız, yanıtınızı ve zamanını cüzdan adresinizle birlikte saklarız.`,
  },
  notStored: {
    title: "Neleri saklamayız",
    items: [
      "Pozisyonlarınızı veya sağlık faktörünüzün geçmişini. Bunlar o anda okunur ve kaydedilmez.",
      "Gönderdiğimiz uyarıların kaydını.",
      `İzleme pikselleri veya reklam çerezleri: site bunların hiçbirini kullanmaz. Cüzdanınızla giriş yaptığınızda Tokenping, yalnızca hangi cüzdanın giriş yaptığını belirten bir çerez yerleştirir; bu çerez 7 gün boyunca ya da cüzdanınızın bu sitedeki bağlantısını kesene kadar geçerlidir. Giriş yaparken ikinci bir çerez, giriş isteğini beş dakika boyunca tutar. Tarayıcınız tema seçiminizi, cüzdan bağlantınızı, bu tarayıcıda hangi cüzdanların giriş yaptığını ve ${ATTRIBUTION_QUESTION_TR} sorusunu size daha önce gösterip göstermediğini kendi yerel depolamasında tutar.`,
      "Veritabanımızda IP adreslerini. Yine de aşağıda listelendiği gibi her isteği Vercel işler. Bir uyarı kontrolü veya mesaj başarısız olduğunda hata, cüzdan adresinizi ve alıcıyı içerebilecek şekilde sunucu kayıtlarımıza düşer.",
    ],
  },
  whoCanSee: {
    title: "Uyarı ayarlarınızı kimler görebilir",
    tiedToWallet:
      "Uyarı ayarları parolalı bir hesaba değil, bir cüzdan adresine bağlıdır. Bunları görmek veya değiştirmek için o cüzdanla bir mesaj imzalarsınız; bu, adresin size ait olduğunu kanıtlar. Bu bir işlem değildir, gas ödemezsiniz ve bir imza o tarayıcıda 7 gün geçerlidir.",
    anyone: hasTelegram =>
      `Bu cüzdan için kaydedilen e-posta adresini${hasTelegram ? ", Signal kullanıcı adını ve Telegram kullanıcı adını" : " ve Signal kullanıcı adını"} yalnızca cüzdanınızla imza atabilen biri görebilir, uyarılarını değiştirebilir veya silebilir. Aşağıda anlatılan herkese açık ödeme kayıtları ise hangi cüzdanların ödeme yaptığını yine gösterir.`,
    dontEnter:
      "Cüzdan adresinizle ilişkilendirilmesini istemeyeceğiniz bir e-posta adresi veya Signal kullanıcı adı girmeyin.",
  },
  processors: {
    title: "Verilerinizi kimler işler",
    list: ({ minutes, hasTelegram }) => [
      {
        name: "Vercel",
        role: `Bu siteyi barındırır ve uyarı kontrolünü her ${minutes} dakikada bir çalıştırır.`,
        receives: "Siteye yapılan her istek (IP adresiniz dahil) ve sunucu kayıtlarımız.",
      },
      {
        name: "Vercel Web Analytics",
        role: "Sayfa görüntülemelerini çerez kullanmadan sayar.",
        receives:
          "Her sayfa görüntülemesi için: sayfa adresi, geldiğiniz site, yaklaşık konumunuz ve tarayıcınız, işletim sisteminiz ve cihaz türünüz. Bir ziyaretçi, isteğin her 24 saatte bir değişen bir özetidir (hash); bu yüzden ziyaretler günler veya siteler arasında ilişkilendirilemez.",
      },
      { name: "Supabase", role: "Veritabanımız.", receives: "Yukarıda listelenen uyarı ayarları." },
      { name: "Resend", role: "Uyarı e-postalarını gönderir.", receives: "E-posta adresiniz ve uyarı metni." },
      {
        name: "Fly.io (Signal aktarıcımız)",
        role: "Signal uyarılarını Signal'a ileten, bizim çalıştırdığımız signal-cli-rest-api sunucusunu barındırır.",
        receives: "Signal kullanıcı adınız ve uyarı metni (Signal da bunları alır).",
      },
      ...(hasTelegram
        ? [
            {
              name: "Telegram",
              role: "Telegram uyarılarını Bot API üzerinden iletir.",
              receives: "Telegram sohbet kimliğiniz ve uyarı metni.",
            },
          ]
        : []),
      {
        name: "RPC sağlayıcıları (PublicNode, Alchemy ve ağların herkese açık uç noktaları)",
        role: "Blokzincir okumalarını yanıtlar: panel için tarayıcınızdan, uyarı kontrolleri ve akıllı cüzdanlardan gelen giriş imzalarını doğrulamak için sunucumuzdan.",
        receives:
          "Okunan cüzdan adresi (ve giriş yaptığınızda imzanız) ile tarayıcınızdan yapılan okumalar için IP adresiniz.",
      },
      {
        name: "Morpho API",
        role: "Morpho paneli için cüzdanınızın borç aldığı listelenen Morpho piyasalarını bulur ve bir Morpho uyarısı kaydettiğinizde sunucumuza bir piyasanın listelenip listelenmediğini bildirir.",
        receives: "Cüzdan adresiniz ve tarayıcınızın yaptığı sorgular için IP adresiniz.",
      },
      {
        name: "WalletConnect",
        role: "WalletConnect ile bağlanırsanız bu site ile cüzdan uygulamanız arasındaki bağlantıyı aktarır.",
        receives: "Cüzdan uygulamanızın ve bu sitenin bağlanmak için paylaştığı bilgiler, örneğin cüzdan adresiniz.",
      },
    ],
    receives: receives => `Aldığı veriler: ${receives}`,
    ownPolicy: "Bu hizmetlerin her biri bu verileri kendi gizlilik politikasına göre işler.",
  },
  onChain: {
    title: "Blokzincirde neler herkese açıktır",
    text: paymentChainName =>
      `Uyarılar için ödeme ${paymentChainName ? `${paymentChainName} ağında` : "ödeme ağında"} yapılır. Her ödeme; ödeyen adresi, token türünü, tutarı, zamanı, satın alınan süreyi ve yeni bitiş tarihini, herkesin okuyabildiği ve kimsenin silemediği herkese açık bir olaya kaydeder. Uyarı ayarlarınız hiçbir zaman bir blokzincire yazılmaz.`,
  },
  retention: {
    title: "Ne kadar süre saklarız ve nasıl silinir",
    settings:
      "Uyarı ayarları, siz uyarıyı panelde silene kadar kalır. Silmek, e-posta adresi ve Signal kullanıcı adı dahil o ağın ayarlarını kaldırır ve etkin erişim gerektirir.",
    telegramStop:
      "Telegram'da Tokenping botuna /stop göndermek sohbetinizin bağlantısını kaldırır ve Telegram uyarılarını durdurur.",
    contact: {
      before: `Erişiminizin süresi dolduysa veya ${ATTRIBUTION_QUESTION_TR} yanıtınızın silinmesini istiyorsanız bize`,
      x: "X",
      middle: "üzerinden ya da",
      telegram: "Telegram",
      or: "veya",
      signal: "Signal",
      after: "topluluğumuzda yazın, silelim.",
    },
    payments: "Blokzincirdeki ödemeler hiç kimse tarafından silinemez.",
  },
  homepage: { before: "Uyarıların nasıl çalıştığıyla ilgili sorular ", link: "ana sayfada", after: " yanıtlanıyor." },
};
