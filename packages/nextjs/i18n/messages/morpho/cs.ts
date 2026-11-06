import type { MorphoMessages } from "./shared";
import { csForMarket, csOnMarket, plural } from "~~/i18n/format";

export const MESSAGES: MorphoMessages = {
  page: {
    metaTitle: "Upozornění na health factor na Morpho Blue a Midnight",
    metaDescription: (networkCount, channels) =>
      `Upozornění na health factor na Morpho Blue a Midnight přes ${channels}, na ${networkCount} sítích, s připomínkou před splatností půjčky.`,
    title: "Pozice a upozornění na health factor na Morpho Blue a Midnight",
    intro: networks =>
      `Vaše vypůjčené pozice v trzích, které uvádí aplikace Morpho, na sítích ${networks}: půjčky s variabilní sazbou (Morpho Blue) a s pevnou sazbou (Morpho Midnight). Health factor se čte přímo z blockchainu.`,
    checks: (minutes, repeatMinutes) =>
      `Upozornění kontrolujeme ${plural("cs", minutes, { one: "každou minutu", few: `každé ${minutes} minuty`, other: `každých ${minutes} minut` })}. Půjčka s pevnou sazbou navíc dostane připomínku 7 dní a 1 den před splatností a po splatnosti upozornění každých ${repeatMinutes} minut, dokud na ní zbývá dluh.`,
    access: "Jedna platba za přístup pokrývá upozornění na Aave i na Morpho.",
    notAffiliated: "Tokenping není s Morpho nijak spojený.",
    guideHealthFactor: "Jak funguje health factor na Morpho",
    guideLiquidation: "Jak funguje likvidace na Morpho",
    guideMidnight: "Půjčky s pevnou sazbou na Morpho Midnight",
    aaveDashboard: "Půjčujete si na Aave? Otevřete přehled Aave",
  },
  positionsHeading: "Vaše pozice na Morpho",
  gate: {
    title: "Pro pokračování připojte peněženku",
    description:
      "Tokenping potřebuje adresu vaší peněženky, aby našel vaše pozice na Morpho. Připojení nepřesouvá žádné prostředky a nic nestojí.",
    connect: "Připojit peněženku",
    connecting: "Připojování",
    approveInWallet: "Potvrďte připojení v peněžence.",
  },
  list: {
    heading: "Trhy",
    count: count => `${count} s dluhem`,
    none: "V trzích, které uvádí aplikace Morpho, jsme nenašli žádnou půjčku.",
    discoveryFailed: "API Morpho neodpovědělo, proto jsou uvedeny jen trhy s uloženým upozorněním.",
    variableRate: "Variabilní sazba",
    fixedRate: "Pevná sazba",
    matures: date => `Splatnost ${date}`,
    matured: "Po splatnosti",
    unreadable: "Nepodařilo se načíst",
    retry: market => `Zkusit znovu načíst ${market}`,
    noneSelectedDescription: "Vyberte trh a zobrazí se jeho pozice na Morpho.",
  },
  details: {
    collateralValue: "Hodnota kolaterálu",
    debt: "Dluh",
    ltv: "LTV",
    lltv: "Likvidační LTV",
    maturity: "Splatnost",
    timeLeft: (days, hours) =>
      days > 0
        ? plural("cs", days, { one: "za 1 den", few: `za ${days} dny`, other: `za ${days} dní` })
        : plural("cs", hours, { one: "za 1 hodinu", few: `za ${hours} hodiny`, other: `za ${hours} hodin` }),
    pastMaturity:
      "Tato půjčka je po splatnosti: jakýkoli zbývající dluh může být kdykoli zlikvidován, bez ohledu na health factor. Splaťte ho, abyste se vyhnuli likvidaci.",
    preLiquidation: "Předběžná likvidace",
    preLiquidationNote:
      "Na tomto trhu jste zapnuli předběžnou likvidaci (pre-liquidation), proto se health factor měří vůči její dřívější hranici: pod 1 může být část vaší pozice prodána.",
    amountsIn: token => `Částky jsou v ${token}, oceněné orákulem trhu.`,
    noDebtTitle: "Na tomto trhu nemáte dluh",
    noDebtDetail: "Uložené upozornění zůstává uložené a bez dluhu nic neposílá.",
    unreadableTitle: "Tuto pozici se nepodařilo načíst",
    unreadableDetail: "Síť neodpověděla. Vaše upozornění se dál kontroluje.",
  },
  paywall: {
    descriptionNew: marketName =>
      `Zaplaťte jednou a nastavte si upozornění na health factor ${csOnMarket(marketName, "market")} i na dalších trzích. Nic se automaticky neobnovuje: když budete chtít přístup prodloužit, zaplatíte znovu ze své peněženky.`,
    descriptionExtend: marketName =>
      `Vaše uložené nastavení upozornění ${csForMarket(marketName, "market")} ve vašem účtu zůstává. Zaplaťte znovu, tím prodloužíte přístup a nastavení můžete upravit.`,
  },
};
