import type { MorphoMessages } from "./shared";
import { filForMarket, filOnMarket, plural } from "~~/i18n/format";

export const MESSAGES: MorphoMessages = {
  page: {
    metaTitle: "Mga health factor alert para sa Morpho Blue at Midnight",
    metaDescription: (networkCount, channels) =>
      `Health factor alert para sa mga loan sa Morpho Blue at Midnight sa ${channels}, sa ${networkCount} network, at paalala sa maturity ng fixed-rate na loan.`,
    title: "Mga posisyon sa Morpho Blue at Midnight at mga health factor alert",
    intro: networks =>
      `Ang mga borrow position mo sa mga market na nakalista sa Morpho app, sa ${networks}: mga variable-rate na loan (Morpho Blue) at mga fixed-rate na loan (Morpho Midnight). Binabasa mula sa chain ang mga health factor.`,
    checks: minutes =>
      `Tinitingnan ang mga alerto bawat ${minutes} minuto. Nakakatanggap din ang fixed-rate na loan ng paalala 7 araw at 1 araw bago ang maturity nito, at ng alerto sa bawat pagtingin pagkalipas ng maturity habang may natitirang utang.`,
    access: "Sakop ng iisang bayad para sa access ang mga alerto mo sa Aave at Morpho.",
    notAffiliated: "Hindi kaanib ng Morpho ang Tokenping.",
    guideHealthFactor: "Paano gumagana ang health factor sa Morpho",
    guideLiquidation: "Paano gumagana ang liquidation sa Morpho",
    guideMidnight: "Mga fixed-rate na loan sa Morpho Midnight",
    aaveDashboard: "Nagbo-borrow sa Aave? Buksan ang Aave dashboard",
  },
  positionsHeading: "Ang mga posisyon mo sa Morpho",
  gate: {
    title: "Ikonekta ang wallet para magpatuloy",
    description:
      "Kailangan ng Tokenping ang wallet address mo para mahanap ang mga posisyon mo sa Morpho. Hindi naglilipat ng pondo ang pagkonekta at walang bayad ito.",
    connect: "Ikonekta ang wallet",
    connecting: "Kumokonekta",
    approveInWallet: "I-approve ang koneksyon sa wallet mo.",
  },
  list: {
    heading: "Mga market",
    count: count => `${count} na may utang`,
    none: "Walang nakitang borrowing sa mga market na nakalista sa Morpho app.",
    discoveryFailed:
      "Hindi sumagot ang API ng Morpho, kaya ang mga market lang na may naka-save na alerto ang nakalista.",
    variableRate: "Variable rate",
    fixedRate: "Fixed rate",
    matures: date => `Maturity sa ${date}`,
    matured: "Lampas na sa maturity",
    unreadable: "Hindi mabasa",
    retry: market => `Subukang basahin ulit ang ${market}`,
    noneSelectedDescription: "Pumili ng market para makita ang posisyon mo sa Morpho doon.",
  },
  details: {
    collateralValue: "Halaga ng collateral",
    debt: "Utang",
    ltv: "LTV",
    lltv: "Liquidation LTV",
    maturity: "Maturity",
    // Filipino nouns do not change after a number: both forms read the same.
    timeLeft: (days, hours) =>
      days > 0
        ? plural("fil", days, { one: `sa loob ng ${days} araw`, other: `sa loob ng ${days} araw` })
        : plural("fil", hours, { one: `sa loob ng ${hours} oras`, other: `sa loob ng ${hours} oras` }),
    pastMaturity:
      "Lampas na sa maturity ang loan na ito: puwedeng ma-liquidate anumang oras ang natitirang utang, anuman ang health factor nito. Bayaran ito para maiwasan ang liquidation.",
    preLiquidation: "Pre-liquidation",
    preLiquidationNote:
      "Pumayag ka sa pre-liquidation sa market na ito, kaya sinusukat ang health factor laban sa mas maagang linya nito: kapag mas mababa sa 1, puwedeng maibenta ang bahagi ng posisyon mo.",
    amountsIn: token => `Nasa ${token} ang mga halaga, ayon sa oracle ng market.`,
    noDebtTitle: "Walang utang sa market na ito",
    noDebtDetail: "Mananatiling naka-save ang naka-save na alerto, at wala itong ipapadala habang walang utang.",
    unreadableTitle: "Hindi mabasa ang posisyong ito",
    unreadableDetail: "Hindi sumagot ang network. Patuloy na tinitingnan ang alerto mo.",
  },
  paywall: {
    descriptionNew: marketName =>
      `Magbayad nang isang beses para mag-set ng mga health factor alert ${filOnMarket(marketName, "market")} at sa ibang market. Walang awtomatikong nire-renew: magbabayad ka mula sa wallet mo kapag gusto mong mag-extend.`,
    descriptionExtend: marketName =>
      `Nasa account mo pa ang mga naka-save mong setting ng alerto ${filForMarket(marketName, "market")}. Magbayad ulit para i-extend ang access at i-edit ang mga ito.`,
  },
};
