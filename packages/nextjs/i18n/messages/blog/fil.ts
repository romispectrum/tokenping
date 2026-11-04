import type { BlogMessages } from "./shared";
// The alert price ("3 USDC kada 30 araw" or the fallback) follows "Nagkakahalaga ang mga alerto ng".
import { formatDecimal } from "~~/i18n/format";

export const MESSAGES: BlogMessages = {
  crumbs: { home: "Home", blog: "Blog" },
  index: {
    title: "Mga gabay sa health factor at liquidation ng Aave at Morpho",
    description:
      "Mga gabay sa health factor ng Aave at Morpho, liquidation, liquidation price at alerto, may halimbawang kuwenta at mga numerong may petsa at sanggunian.",
    kicker: "Mga gabay sa Aave at Morpho",
    lead: "Paano gumagana ang health factor sa Aave at sa Morpho, ano ang nangyayari sa liquidation, paano kuwentahin ang liquidation price mo at paano ka mababalaan bago ito lumapit. Bawat numero sa mga gabay na ito ay may nakasaad na sanggunian at petsa kung kailan ito tiningnan.",
    dashboardCta: "Buksan ang Aave dashboard",
    morphoDashboardCta: "Buksan ang Morpho dashboard",
    rss: "Mag-subscribe gamit ang RSS",
    startHere: "Magsimula rito",
    allGuides: "Lahat ng gabay",
    empty: {
      title: "Wala pang gabay",
      description:
        "Inihahanda pa ang mga gabay sa Filipino. Mag-subscribe gamit ang RSS para matanggap mo ang mga ito kapag nailathala na.",
      otherLanguage: "Basahin ang mga gabay sa English",
    },
  },
  post: {
    kicker: "Gabay sa Aave V3",
    morphoKicker: "Gabay sa Morpho",
    byline: { author: "Isinulat ng Tokenping team", published: "Nailathala", updated: "Na-update" },
    readingTime: minutes => `${minutes} minutong basa`,
    readGuide: "Basahin ang gabay",
    related: "Mga kaugnay na gabay",
  },
  endBox: {
    label: "Tungkol sa Tokenping",
    title: "Mga health factor alert mula sa Tokenping",
    body: ({ minutes, networks, channels, price, paymentChain }) =>
      `Tinitingnan ng Tokenping ang health factor mo sa Aave V3 at V4 bawat ${minutes} minuto sa ${networks} network at pinapadalhan ka ng mensahe sa ${channels} kapag mas mababa ito sa threshold mo. Nagkakahalaga ang mga alerto ng ${price}${paymentChain ? `, binabayaran sa ${paymentChain}` : ""}; hindi mo kailangang magbayad para tingnan ang mga posisyon mo. Binibigyan ka ng mga alerto ng oras para kumilos; hindi nito napipigilan ang liquidation.`,
    cta: "Buksan ang dashboard",
    morpho: {
      title: "Mga Morpho health factor alert mula sa Tokenping",
      body: ({ minutes, networks, channels, price, paymentChain }) =>
        `Tinitingnan ng Tokenping ang health factor mo sa Morpho Blue at Midnight bawat ${minutes} minuto sa ${networks} network at pinapadalhan ka ng mensahe sa ${channels} kapag mas mababa ito sa threshold mo, may paalala bago mag-maturity ang isang fixed-rate na loan. Nagkakahalaga ang mga alerto ng ${price}${paymentChain ? `, binabayaran sa ${paymentChain}` : ""}, ang parehong plan ng mga Aave alert; hindi mo kailangang magbayad para tingnan ang mga posisyon mo. Binibigyan ka ng mga alerto ng oras para kumilos; hindi nito napipigilan ang liquidation.`,
      cta: "Buksan ang Morpho dashboard",
    },
  },
  alertPrice: {
    fallback: "kaunting USDC (tingnan ang kasalukuyang presyo sa dashboard)",
    plan: ({ priceLabel, days }) =>
      days === 1
        ? `${formatDecimal("fil", priceLabel)} kada araw`
        : `${formatDecimal("fil", priceLabel)} kada ${days} araw`,
  },
  callout: { info: "Paalala", warning: "Babala" },
  shortAnswer: "Maikling sagot",
  scopeNote: {
    text: "Para sa Aave V3.7, tiningnan sa mga market na Ethereum Core, Arbitrum, Base, Optimism, Polygon, Avalanche at Gnosis. Maaaring mas lumang bersyon ang tumatakbo sa ibang V3 market at network. Nakasaad ang mga pagkakaiba sa Aave V4 kung saan magkaiba ang mga patakaran.",
    morphoText:
      "Para sa mga market ng Morpho Blue at Morpho Midnight na nakalista sa Morpho app. Bawat market ay may sariling collateral, oracle at LLTV, kaya tingnan ang mga numero ng market mo.",
    figuresAsOf: "Mga numero noong",
  },
  table: {
    fallbackLabel: "Table, puwedeng i-scroll pagilid",
    label: (heading, index) => (index === undefined ? `Table: ${heading}` : `Table ${index}: ${heading}`),
    scrollHint: "Mag-scroll pagilid para makita ang bawat column.",
  },
};
