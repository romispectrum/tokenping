import type { AlertsMessages } from "./shared";
import { plural, trForMarket, trOnMarket } from "~~/i18n/format";

const ATTRIBUTION_QUESTION = "Tokenping'i nereden duydunuz?";

// The channel's name comes from serviceNames, where email is the badge "E-posta"; inside a sentence it is "e-posta".
const channelInSentence = (channel: string) => (channel === "E-posta" ? "e-posta" : channel);

export const MESSAGES: AlertsMessages = {
  cardTitle: "Uyarı ayarları",
  active: "Etkin",
  payToEdit: "Düzenlemek için erişim satın alın",
  editAlert: "Uyarıyı düzenle",
  signInTitle: "Uyarılarınızı yönetmek için giriş yapın",
  signInDescription:
    "Cüzdanınız, adresin size ait olduğunu kanıtlayan bir mesaj imzalar. Bu bir işlem değildir ve gas ödemezsiniz.",
  signIn: "Cüzdanla giriş yap",
  signingIn: "Cüzdanınız bekleniyor",
  signInStatement: "Sağlık faktörü uyarılarınızı görmek ve düzenlemek için Tokenping'e giriş yapın.",
  signInRejected: "İmza isteğini reddettiniz. Uyarılarınızı görmek ve düzenlemek için giriş yapın.",
  signInFailed: "Giriş yapılamadı. Tekrar deneyin.",
  signInExpired: "Oturumunuz sona erdi. Cüzdanınızla tekrar giriş yapın.",
  emptyTitle: (chainName, kind) => `${trOnMarket(chainName, kind)} henüz uyarı yok`,
  emptyDescription: "Sağlık faktörünüz seçtiğiniz eşiğin altına düştüğünde bir mesaj alın.",
  createAlert: "Uyarı oluştur",
  loadErrorTitle: "Uyarı ayarları yüklenemedi",
  loadErrorDescription: "Bağlantınızı kontrol edip tekrar deneyin.",
  tryAgain: "Tekrar dene",
  retrying: "Yeniden deneniyor",
  servicesLegend: "Uyarı kanalları",
  servicesDescription: "Uyarıların nereye gideceğini seçin. Birden fazla kanal seçebilirsiniz.",
  serviceNames: { email: "E-posta", signal: "Signal", telegram: "Telegram" },
  emailLabel: "E-posta adresi",
  emailDescription: "Uyarılar bu adrese gönderilir.",
  emailPlaceholder: "adiniz@example.com",
  signalLabel: "Signal kullanıcı adı",
  signalDescription: "Signal uygulamasında Ayarlar'ı, ardından Profil'i açın. alice.42 gibi görünür.",
  telegramLabel: "Telegram kullanıcı adı",
  telegramDescription:
    "Uyarılar bu Telegram hesabına gider. Kullanıcı adınızı Telegram uygulamasında Ayarlar, ardından Kullanıcı adı altında bulabilirsiniz.",
  telegramPlaceholder: "alice_eth",
  telegramChecking: "Kontrol ediliyor",
  telegramLinked: username => `@${username} bağlandı: uyarılar Telegram sohbetinize gelecek.`,
  telegramPressStart: bot =>
    `Henüz bağlı değil: ${bot ? `@${bot} sohbetinde` : "Tokenping botunda"} bir kez Start'a basın.`,
  openBot: bot => `@${bot} sohbetini aç`,
  telegramStatusUnknown: "Bu kullanıcı adının bağlı olup olmadığı kontrol edilemedi. Yine de kaydedebilirsiniz.",
  opensInNewTab: "(yeni sekmede açılır)",
  channelLanguageLabels: {
    email: "E-posta dili",
    signal: "Signal mesaj dili",
    telegram: "Telegram mesaj dili",
  },
  thresholdLabel: "Sağlık faktörü eşiği",
  thresholdExactValue: "(tam değer)",
  thresholdScale: { critical: "Kritik", safe: "Güvenli", verySafe: "Çok güvenli" },
  thresholdDescription: (threshold, chainName, kind) =>
    `${trOnMarket(chainName, kind)} sağlık faktörünüz ${threshold} değerinin altına düştüğünde bildirim alırsınız.`,
  saveAlert: "Uyarıyı kaydet",
  saving: "Kaydediliyor",
  cancel: "İptal",
  deleteAlert: "Uyarıyı sil",
  deleting: "Siliniyor",
  keepAlert: "Uyarıyı koru",
  deleteTitle: "Bu uyarı silinsin mi?",
  deleteDescription: (chainName, kind) =>
    `Tokenping, ${trForMarket(chainName, kind)} sağlık faktörü uyarıları göndermeyi bırakır.`,
  // Turkish keeps the noun singular after a number, so both forms read the same.
  errorSummaryTitle: count =>
    plural("tr", count, {
      one: `Kaydetmek için ${count} alanı düzeltin`,
      other: `Kaydetmek için ${count} alanı düzeltin`,
    }),
  formErrors: {
    noService: "En az bir uyarı kanalı seçin.",
    noEmail: "E-posta adresinizi girin.",
    invalidEmail: "Bir e-posta adresi girin, örneğin ad@example.com.",
    noSignal: "Signal kullanıcı adınızı girin.",
    invalidSignal:
      "Bir Signal kullanıcı adı girin, örneğin alice.42. Kendi kullanıcı adınızı Signal uygulamasında Ayarlar, ardından Profil altında bulabilirsiniz.",
    noTelegram: "Telegram kullanıcı adınızı girin.",
    invalidTelegram:
      "Bir Telegram kullanıcı adı girin, örneğin alice_eth: 4 ile 32 arası harf, rakam veya alt çizgi; bir harfle başlamalı ve _ ile bitmemeli.",
  },
  summaryServices: "Kanallar",
  summaryNoServices: "Seçilmedi",
  summaryEmail: "E-posta",
  summarySignal: "Signal",
  summaryTelegram: "Telegram",
  summaryLanguage: "Dil",
  summaryTelegramNotLinked: bot => `Henüz bağlı değil: @${bot} sohbetinde bir kez Start'a basın.`,
  summaryThreshold: "Eşik",
  sendTest: "Test gönder",
  sendingTest: "Gönderiliyor",
  testAgainIn: minutes => `${minutes} dk sonra tekrar`,
  testSent: channel => `Test mesajı ${channelInSentence(channel)} ile gönderildi. Ulaşıp ulaşmadığını kontrol edin.`,
  testFailed: "Test mesajı gönderilemedi",
  testLimitNote: minutes =>
    `Test, bu uyarıyı ve pozisyonunuzu şu anki haliyle gönderir. Kanal başına ${minutes} dakikada bir test gönderebilirsiniz.`,
  belowThresholdTitle: "Uyarı eşiğinizin altında",
  belowThresholdDescription: (healthFactor, threshold) =>
    `Mevcut sağlık faktörünüz (${healthFactor}), ${threshold} olan eşiğinizin altında.`,
  alertSaved: "Uyarı kaydedildi",
  saveFailed: "Uyarınız kaydedilemedi",
  alertDeleted: "Uyarı silindi",
  deleteFailed: "Uyarınız silinemedi",
  attributionQuestion: ATTRIBUTION_QUESTION,
  attributionFormLabel: `${ATTRIBUTION_QUESTION} (isteğe bağlı)`,
  attributionDescription:
    "Hangi kanalların işe yaradığını anlamamıza yardımcı olur. Cüzdan adresinizle birlikte kaydedilir.",
  attributionEmpty: "Bir yanıt girin veya Atla'yı seçin.",
  // The checks behind it (length, hidden control characters) only fail for pasted text.
  attributionInvalid: () => "Yanıt çok uzun veya gizli karakterler içeriyor. Yeniden yazıp tekrar deneyin.",
  attributionSendFailed: "Yanıtınız gönderilemedi. Tekrar deneyin veya atlayın.",
  sendAnswer: "Yanıtı gönder",
  sending: "Gönderiliyor",
  skip: "Atla",
  answerSent: "Yanıt gönderildi",
};
