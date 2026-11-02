import type { NotificationMessages } from "./shared";
import { trOnMarket } from "~~/i18n/format";

// Read on a phone: short sentences, the network's name before "ağında" so no suffix follows it.
export const MESSAGES: NotificationMessages = {
  alertText: ({ chainName, healthFactor, threshold, timestamp }) =>
    `${trOnMarket(chainName)} Aave sağlık faktörünüz ${healthFactor}. ` +
    `Bu, ${threshold} olan eşiğinizin altında. ` +
    `Likidasyondan kaçınmak için teminat eklemeyi veya borcunuzu geri ödemeyi düşünün.\n\nGönderilme zamanı: ${timestamp}`,
  alertSubject: chainName => `Aave sağlık faktörü uyarısı - ${chainName}`,
  // The html footer says "Oluşturulma zamanı" (created at) where the text says "Gönderilme zamanı" (sent at).
  alertHtml: ({ chainName, healthFactor, threshold, timestamp }) =>
    `<p>${trOnMarket(chainName).replace(chainName, `<strong>${chainName}</strong>`)} Aave sağlık faktörünüz ` +
    `<strong>${healthFactor}</strong>. Bu, <strong>${threshold}</strong> olan eşiğinizin altında.</p>` +
    `<p>Likidasyondan kaçınmak için teminat eklemeyi veya borcunuzu geri ödemeyi düşünün.</p>` +
    `<p><small>Oluşturulma zamanı: ${timestamp}</small></p>`,
  testLines: ({ chainName, threshold, minutes, timestamp, position }) => {
    const statusWord = { critical: "kritik", risky: "riskli", safe: "güvenli" };
    const now =
      position.kind === "debt"
        ? `Şu an: sağlık faktörü ${position.healthFactor} (${statusWord[position.status]}), teminat ${position.collateral}, borç ${position.debt}.`
        : position.kind === "noDebt"
          ? `Şu an: borç yok, bu yüzden likide edilecek bir şey yok${position.collateral ? ` (teminat ${position.collateral})` : ""}.`
          : position.kind === "none"
            ? "Şu an: bu piyasada açık pozisyon yok."
            : "Şu an: pozisyonunuz okunamadı. Gerçek uyarılar her kontrolde yeniden dener.";
    const verdict =
      position.kind === "debt"
        ? position.belowThreshold
          ? "Bu, eşiğinizin altında. Bir sonraki kontrol gerçek bir uyarı gönderir."
          : "Bu, eşiğinizin üstünde. Şu anda uyarı gönderilmezdi."
        : null;
    return [
      "Tokenping test mesajı: bu kanaldaki uyarılar çalışıyor.",
      `Uyarınız: ${chainName}, sağlık faktörü ${threshold} değerinin altına düştüğünde.`,
      now,
      ...(verdict ? [verdict] : []),
      `Her ${minutes} dakikada bir kontrol edilir. Gönderilme zamanı: ${timestamp}`,
    ];
  },
  testSubject: chainName => `Tokenping test mesajı - ${chainName}`,
  morphoMarketName: market =>
    market.kind === "blue"
      ? `${market.collateral}/${market.loan} (${market.lltv} LLTV)`
      : `${market.loan} sabit faiz, vade ${market.maturity}`,
  morphoAlertLines: ({ chainName, market, healthFactor, threshold, timestamp, preLiquidation }) => [
    `${trOnMarket(chainName, "network")} Morpho sağlık faktörünüz ${healthFactor}. Bu, ${threshold} olan eşiğinizin altında.`,
    `Piyasa: ${market}.`,
    ...(preLiquidation
      ? [
          "Bu piyasada ön likidasyonu (pre-liquidation) seçtiniz. Bu yüzden sağlık faktörü onun daha erken eşiğine göre ölçülür: 1'in altında pozisyonunuzun bir kısmı satılabilir.",
        ]
      : []),
    "Likidasyondan kaçınmak için teminat eklemeyi veya borcunuzu geri ödemeyi düşünün.",
    `Gönderilme zamanı: ${timestamp}`,
  ],
  morphoAlertSubject: chainName => `Morpho sağlık faktörü uyarısı - ${chainName}`,
  maturityLines: ({ stage, chainName, market, when, debt, timestamp }) =>
    stage === "matured"
      ? [
          `${trOnMarket(chainName, "network")} Morpho sabit faizli kredinizin vadesi ${when} tarihinde doldu. Hâlâ ${debt} borcunuz var.`,
          `Piyasa: ${market}.`,
          "Artık sağlık faktörü ne olursa olsun her an likide edilebilir. Likidasyondan kaçınmak için borcu geri ödeyin.",
          `Gönderilme zamanı: ${timestamp}`,
        ]
      : [
          `${trOnMarket(chainName, "network")} Morpho sabit faizli kredinizin vadesi ${stage === "7d" ? "7 gün" : "24 saat"} içinde doluyor: ${when}.`,
          `Piyasa: ${market}.`,
          `Borç: ${debt}.`,
          "Vade sonundan sonra ödenmemiş borç likide edilebilir. Bu yüzden borcu vadeden önce geri ödeyin.",
          `Gönderilme zamanı: ${timestamp}`,
        ],
  maturitySubject: ({ stage, chainName }) =>
    stage === "matured"
      ? `Morpho kredisinin vadesi geçti - ${chainName}`
      : `Morpho kredisinin vadesi ${stage === "7d" ? "7 gün" : "24 saat"} içinde doluyor - ${chainName}`,
};
