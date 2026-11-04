import type { MorphoMessages } from "./shared";
import { hrForMarket, hrOnMarket, hrSrChannelsGenitive, plural } from "~~/i18n/format";

/** "na 7 mreža", "na 2 mreže", "na 1 mreži". */
const onNetworks = (count: number) =>
  plural("hr", count, { one: `na ${count} mreži`, few: `na ${count} mreže`, other: `na ${count} mreža` });

/** "svakih 5 minuta", "svake 2 minute", "svake minute". */
const everyMinutes = (minutes: number) =>
  minutes === 1
    ? "svake minute"
    : plural("hr", minutes, {
        one: `svakih ${minutes} minuta`,
        few: `svake ${minutes} minute`,
        other: `svakih ${minutes} minuta`,
      });

export const MESSAGES: MorphoMessages = {
  page: {
    metaTitle: "Upozorenja za health factor na Morphu, Blue i Midnight",
    metaDescription: (networkCount, channels) =>
      `Upozorenja za health factor na Morphu Blue i Midnight, putem ${hrSrChannelsGenitive(channels)}, ${onNetworks(networkCount)}. Podsjetnik prije dospijeća fiksnog zajma.`,
    title: "Pozicije na Morphu Blue i Midnight i upozorenja za health factor",
    intro: networks =>
      `Tvoje pozicije zaduženja na tržištima koja navodi aplikacija Morpho, na ovim mrežama: ${networks}. Zajmovi s promjenjivom kamatom (Morpho Blue) i zajmovi s fiksnom kamatom (Morpho Midnight). Health factor se čita s blockchaina.`,
    checks: minutes =>
      `Upozorenja se provjeravaju ${everyMinutes(minutes)}. Zajam s fiksnom kamatom dobiva i podsjetnik 7 dana i 1 dan prije dospijeća, a nakon dospijeća upozorenje pri svakoj provjeri dok god ostaje duga.`,
    access: "Jedno plaćanje pristupa pokriva tvoja upozorenja na Aaveu i na Morphu.",
    notAffiliated: "Tokenping nije povezan s Morphom.",
    guideHealthFactor: "Kako radi health factor na Morphu",
    guideLiquidation: "Kako radi likvidacija na Morphu",
    guideMidnight: "Zajmovi s fiksnom kamatom na Morphu Midnight",
    aaveDashboard: "Zadužuješ se na Aaveu? Otvori nadzornu ploču za Aave",
  },
  positionsHeading: "Tvoje pozicije na Morphu",
  gate: {
    title: "Poveži novčanik za nastavak",
    description:
      "Tokenpingu treba adresa tvog novčanika da pronađe tvoje pozicije na Morphu. Povezivanje ne premješta sredstva i ne naplaćuje naknadu.",
    connect: "Poveži novčanik",
    connecting: "Povezivanje",
    approveInWallet: "Odobri povezivanje u svom novčaniku.",
  },
  list: {
    heading: "Tržišta",
    count: count =>
      plural("hr", count, { one: `${count} s dugom`, few: `${count} s dugom`, other: `${count} s dugom` }),
    none: "Na tržištima koja navodi aplikacija Morpho nije pronađeno zaduženje.",
    discoveryFailed: "Morphov API nije odgovorio, pa su navedena samo tržišta sa spremljenim upozorenjem.",
    variableRate: "Promjenjiva kamata",
    fixedRate: "Fiksna kamata",
    matures: date => `Dospijeće: ${date}`,
    matured: "Nakon dospijeća",
    unreadable: "Nije bilo moguće očitati",
    retry: market => `Ponovno očitaj tržište ${market}`,
    noneSelectedDescription: "Odaberi tržište da vidiš svoju poziciju na Morphu.",
  },
  details: {
    collateralValue: "Vrijednost kolaterala",
    debt: "Dug",
    ltv: "LTV",
    lltv: "Likvidacijski LTV",
    maturity: "Dospijeće",
    timeLeft: (days, hours) =>
      days > 0
        ? plural("hr", days, { one: `za ${days} dan`, few: `za ${days} dana`, other: `za ${days} dana` })
        : plural("hr", hours, { one: `za ${hours} sat`, few: `za ${hours} sata`, other: `za ${hours} sati` }),
    pastMaturity:
      "Ovaj zajam je prošao dospijeće: preostali dug može se likvidirati u bilo kojem trenutku, bez obzira na health factor. Otplati ga da izbjegneš likvidaciju.",
    preLiquidation: "Predlikvidacija",
    preLiquidationNote:
      "Na ovom tržištu predlikvidacija je uključena, pa se health factor mjeri prema njezinoj ranijoj granici: ispod 1 dio tvoje pozicije može se prodati.",
    amountsIn: token => `Iznosi su u tokenu ${token}, vrednovani prema oraklu tržišta.`,
    noDebtTitle: "Na ovom tržištu nema duga",
    noDebtDetail: "Spremljeno upozorenje ostaje spremljeno i ne šalje ništa dok nema duga.",
    unreadableTitle: "Ova pozicija nije očitana",
    unreadableDetail: "Mreža nije odgovorila. Tvoje upozorenje i dalje se provjerava.",
  },
  paywall: {
    descriptionNew: marketName =>
      `Plati jednom da postaviš upozorenja za health factor ${hrOnMarket(marketName, "market")} i na drugim tržištima. Ništa se ne obnavlja automatski: plaćaš iz svog novčanika kad želiš produljiti.`,
    descriptionExtend: marketName =>
      `Tvoje spremljene postavke upozorenja ${hrForMarket(marketName, "market")} i dalje su na tvom računu. Plati ponovno da produljiš pristup i urediš ih.`,
  },
};
