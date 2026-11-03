import type { MorphoMessages } from "./shared";
import { plural, trForMarket, trOnMarket } from "~~/i18n/format";

export const MESSAGES: MorphoMessages = {
  page: {
    metaTitle: "Morpho Blue ve Midnight sağlık faktörü uyarıları",
    metaDescription: (networkCount, channels) =>
      `${channels} ile Morpho Blue ve Midnight kredileri için sağlık faktörü uyarıları; ${networkCount} ağda, sabit faizli kredide vade öncesi hatırlatmayla.`,
    title: "Morpho Blue ve Midnight pozisyonları ve sağlık faktörü uyarıları",
    intro: networks =>
      `Morpho uygulamasının listelediği piyasalardaki borç pozisyonlarınız, şu ağlarda: ${networks}. Değişken faizli krediler (Morpho Blue) ve sabit faizli krediler (Morpho Midnight). Sağlık faktörleri zincirden okunur.`,
    checks: minutes =>
      `Uyarılar her ${minutes} dakikada bir kontrol edilir. Sabit faizli bir kredi için vade sonundan 7 gün ve 1 gün önce hatırlatma da gönderilir; vade sonundan sonra ise borç kaldığı sürece her kontrolde bir uyarı gönderilir.`,
    access: "Tek bir erişim ödemesi Aave ve Morpho uyarılarınızı birlikte kapsar.",
    notAffiliated: "Tokenping'in Morpho ile bağlantısı yoktur.",
    guideHealthFactor: "Morpho'da sağlık faktörü nasıl çalışır",
    guideLiquidation: "Morpho'da likidasyon nasıl işler",
    guideMidnight: "Morpho Midnight sabit faizli krediler",
    aaveDashboard: "Aave'de mi borç alıyorsunuz? Aave panelini açın",
  },
  positionsHeading: "Morpho pozisyonlarınız",
  gate: {
    title: "Devam etmek için cüzdan bağlayın",
    description:
      "Tokenping'in Morpho pozisyonlarınızı bulabilmesi için cüzdan adresinize ihtiyacı var. Bağlanmak fonlarınızı hareket ettirmez ve hiçbir şey ödemezsiniz.",
    connect: "Cüzdan bağla",
    connecting: "Bağlanıyor",
    approveInWallet: "Bağlantıyı cüzdanınızda onaylayın.",
  },
  list: {
    heading: "Piyasalar",
    count: count => `${count} borçlu piyasa`,
    none: "Morpho uygulamasının listelediği piyasalarda borç bulunamadı.",
    discoveryFailed: "Morpho API yanıt vermedi, bu yüzden yalnızca kayıtlı uyarısı olan piyasalar listeleniyor.",
    variableRate: "Değişken faiz",
    fixedRate: "Sabit faiz",
    matures: date => `Vade sonu: ${date}`,
    matured: "Vadesi geçti",
    unreadable: "Okunamadı",
    retry: market => `Yeniden oku: ${market}`,
    noneSelectedDescription: "Morpho pozisyonunu görmek için bir piyasa seçin.",
  },
  details: {
    collateralValue: "Teminat değeri",
    debt: "Borç",
    ltv: "LTV",
    lltv: "Likidasyon LTV'si",
    maturity: "Vade",
    // Turkish keeps the noun singular after a number: "1 gün sonra", "3 gün sonra".
    timeLeft: (days, hours) =>
      days > 0
        ? plural("tr", days, { one: "1 gün sonra", other: `${days} gün sonra` })
        : plural("tr", hours, { one: "1 saat sonra", other: `${hours} saat sonra` }),
    pastMaturity:
      "Bu kredinin vadesi geçti: kalan borç, sağlık faktörü ne olursa olsun her an likide edilebilir. Likidasyondan kaçınmak için borcu geri ödeyin.",
    preLiquidation: "Ön likidasyon",
    preLiquidationNote:
      "Bu piyasada ön likidasyonu (pre-liquidation) seçtiniz, bu yüzden sağlık faktörü onun daha erken eşiğine göre ölçülür: 1'in altında pozisyonunuzun bir kısmı satılabilir.",
    amountsIn: token => `Tutarlar ${token} cinsindendir ve piyasanın oracle fiyatıyla değerlenir.`,
    noDebtTitle: "Bu piyasada borç yok",
    noDebtDetail: "Kayıtlı bir uyarı kayıtlı kalır ve borç olmadığı sürece hiçbir şey göndermez.",
    unreadableTitle: "Bu pozisyon okunamadı",
    unreadableDetail: "Ağ yanıt vermedi. Uyarınız kontrol edilmeye devam ediyor.",
  },
  paywall: {
    descriptionNew: marketName =>
      `${trOnMarket(marketName, "market")} ve diğer piyasalarda sağlık faktörü uyarıları kurmak için bir kez ödeyin. Hiçbir şey otomatik yenilenmez: uzatmak istediğinizde cüzdanınızdan ödersiniz.`,
    descriptionExtend: marketName =>
      `${trForMarket(marketName, "market")} kayıtlı uyarı ayarlarınız hâlâ hesabınızda. Erişimi uzatmak ve onları düzenlemek için tekrar ödeyin.`,
  },
};
