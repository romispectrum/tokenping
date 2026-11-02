import type { BlogMessages } from "./shared";
// The alert price ("30 gün için 3 USDC" or the fallback) stands where a bare noun phrase reads: "Uyarıların fiyatı: ...".
import { formatDecimal } from "~~/i18n/format";

export const MESSAGES: BlogMessages = {
  crumbs: { home: "Ana sayfa", blog: "Blog" },
  index: {
    title: "Aave ve Morpho sağlık faktörü ve likidasyon rehberleri",
    description:
      "Aave ve Morpho'da sağlık faktörü, likidasyonlar, likidasyon fiyatları ve uyarılar üzerine rehberler; örnek hesaplar ve tarihli, kaynaklı verilerle.",
    kicker: "Aave ve Morpho rehberleri",
    lead: "Sağlık faktörü Aave'de ve Morpho'da nasıl çalışır, likidasyonda ne olur, likidasyon fiyatınızı nasıl hesaplarsınız ve fiyat ona yaklaşmadan nasıl uyarı alırsınız. Bu rehberlerdeki her veri, kaynağını ve kontrol edildiği tarihi belirtir.",
    dashboardCta: "Aave panelini aç",
    morphoDashboardCta: "Morpho panelini aç",
    rss: "RSS ile abone ol",
    startHere: "Buradan başlayın",
    allGuides: "Tüm rehberler",
    empty: {
      title: "Henüz rehber yok",
      description:
        "Rehberlerin Türkçe sürümleri hazırlanıyor. Yayımlandıklarında almak için RSS ile abone olabilirsiniz.",
      otherLanguage: "Rehberleri İngilizce okuyun",
    },
  },
  post: {
    kicker: "Aave V3 rehberi",
    morphoKicker: "Morpho rehberi",
    byline: { author: "Tokenping ekibi", published: "Yayımlandı", updated: "Güncellendi" },
    readingTime: minutes => `${minutes} dk okuma`,
    readGuide: "Rehberi oku",
    related: "İlgili rehberler",
  },
  endBox: {
    label: "Tokenping hakkında",
    title: "Tokenping ile sağlık faktörü uyarıları",
    body: ({ minutes, networks, channels, price, paymentChain }) =>
      `Tokenping, Aave V3 ve V4 sağlık faktörünüzü ${networks} ağda her ${minutes} dakikada bir kontrol eder ve eşiğinizin altında olduğunda size ${channels} üzerinden mesaj gönderir. Uyarıların fiyatı: ${price}${paymentChain ? `, ödeme ${paymentChain} ağında yapılır` : ""}; pozisyonlarınızı görmek ödeme gerektirmez. Uyarılar size harekete geçmek için zaman kazandırır; likidasyonu engellemez.`,
    cta: "Paneli aç",
    morpho: {
      title: "Tokenping ile Morpho sağlık faktörü uyarıları",
      body: ({ minutes, networks, channels, price, paymentChain }) =>
        `Tokenping, Morpho Blue ve Midnight sağlık faktörünüzü ${networks} ağda her ${minutes} dakikada bir kontrol eder ve eşiğinizin altında olduğunda size ${channels} üzerinden mesaj gönderir; sabit faizli bir kredinin vadesi dolmadan önce de hatırlatma gönderir. Uyarıların fiyatı: ${price}${paymentChain ? `, ödeme ${paymentChain} ağında yapılır` : ""}, Aave uyarılarıyla aynı plan; pozisyonlarınızı görmek ödeme gerektirmez. Uyarılar size harekete geçmek için zaman kazandırır; likidasyonu engellemez.`,
      cta: "Morpho panelini aç",
    },
  },
  alertPrice: {
    fallback: "küçük bir USDC ücreti (güncel fiyat panelde yazar)",
    plan: ({ priceLabel, days }) =>
      days === 1 ? `günlük ${formatDecimal("tr", priceLabel)}` : `${days} gün için ${formatDecimal("tr", priceLabel)}`,
  },
  callout: { info: "Not", warning: "Dikkat" },
  shortAnswer: "Kısa yanıt",
  scopeNote: {
    text: "Aave V3.7 için geçerlidir; Ethereum Core, Arbitrum, Base, Optimism, Polygon, Avalanche ve Gnosis piyasalarında kontrol edildi. Diğer V3 piyasaları ve ağları daha eski sürümleri çalıştırıyor olabilir. Aave V4 farkları, kuralların ayrıldığı yerlerde belirtilir.",
    morphoText:
      "Morpho uygulamasında listelenen Morpho Blue ve Morpho Midnight piyasaları için geçerlidir. Her piyasa kendi teminatını, oracle kaynağını ve LLTV değerini belirler; bu yüzden kendi piyasanızın değerlerini kontrol edin.",
    figuresAsOf: "Verilerin tarihi:",
  },
  table: {
    fallbackLabel: "Tablo, yatay kaydırılır",
    label: (heading, index) => (index === undefined ? `Tablo: ${heading}` : `Tablo ${index}: ${heading}`),
    scrollHint: "Tüm sütunları görmek için yana kaydırın.",
  },
};
