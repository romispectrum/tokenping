import type { MorphoMessages } from "./shared";
import { hrSrChannelsGenitive, plural, srForMarket, srOnMarket } from "~~/i18n/format";

/** "na 7 mreža", "na 2 mreže", "na 1 mreži". */
const onNetworks = (count: number) =>
  plural("sr", count, { one: `na ${count} mreži`, few: `na ${count} mreže`, other: `na ${count} mreža` });

/** "svakih 5 minuta", "svaka 2 minuta", "svakog minuta" (minut is masculine in Serbian). */
const everyMinutes = (minutes: number) =>
  minutes === 1
    ? "svakog minuta"
    : plural("sr", minutes, {
        one: `svaki ${minutes} minut`,
        few: `svaka ${minutes} minuta`,
        other: `svakih ${minutes} minuta`,
      });

export const MESSAGES: MorphoMessages = {
  page: {
    metaTitle: "Morpho upozorenja za health factor, Blue i Midnight",
    metaDescription: (networkCount, channels) =>
      `Upozorenja za health factor na protokolu Morpho Blue i Midnight, preko ${hrSrChannelsGenitive(channels)}, ${onNetworks(networkCount)}. Podsetnik pre dospeća fiksnog zajma.`,
    title: "Pozicije na protokolu Morpho Blue i Midnight i upozorenja za health factor",
    intro: networks =>
      `Tvoje pozicije zaduženja na tržištima koja navodi aplikacija Morpho, na ovim mrežama: ${networks}. Zajmovi s promenljivom kamatom (Morpho Blue) i zajmovi s fiksnom kamatom (Morpho Midnight). Health factor se čita sa blockchaina.`,
    checks: minutes =>
      `Upozorenja se proveravaju ${everyMinutes(minutes)}. Zajam s fiksnom kamatom dobija i podsetnik 7 dana i 1 dan pre dospeća, a posle dospeća upozorenje pri svakoj proveri dok god ostaje duga.`,
    access: "Jedno plaćanje pristupa pokriva tvoja upozorenja za Aave i za Morpho.",
    notAffiliated: "Tokenping nije povezan sa Morpho timom.",
    guideHealthFactor: "Kako radi health factor na protokolu Morpho",
    guideLiquidation: "Kako radi likvidacija na protokolu Morpho",
    guideMidnight: "Zajmovi s fiksnom kamatom na protokolu Morpho Midnight",
    aaveDashboard: "Zadužuješ se na protokolu Aave? Otvori kontrolnu tablu za Aave",
  },
  positionsHeading: "Tvoje pozicije na protokolu Morpho",
  gate: {
    title: "Poveži novčanik da nastaviš",
    description:
      "Tokenpingu je potrebna adresa tvog novčanika da pronađe tvoje pozicije na protokolu Morpho. Povezivanje ne premešta sredstva i ne naplaćuje naknadu.",
    connect: "Poveži novčanik",
    connecting: "Povezivanje",
    approveInWallet: "Odobri povezivanje u svom novčaniku.",
  },
  list: {
    heading: "Tržišta",
    count: count =>
      plural("sr", count, { one: `${count} sa dugom`, few: `${count} sa dugom`, other: `${count} sa dugom` }),
    none: "Na tržištima koja navodi aplikacija Morpho nije pronađeno zaduženje.",
    discoveryFailed: "Morpho API nije odgovorio, pa su navedena samo tržišta sa sačuvanim upozorenjem.",
    variableRate: "Promenljiva kamata",
    fixedRate: "Fiksna kamata",
    matures: date => `Dospeće: ${date}`,
    matured: "Posle dospeća",
    unreadable: "Nije bilo moguće očitati",
    retry: market => `Ponovo očitaj tržište ${market}`,
    noneSelectedDescription: "Izaberi tržište da vidiš svoju poziciju na protokolu Morpho.",
  },
  details: {
    collateralValue: "Vrednost kolaterala",
    debt: "Dug",
    ltv: "LTV",
    lltv: "Likvidacioni LTV",
    maturity: "Dospeće",
    timeLeft: (days, hours) =>
      days > 0
        ? plural("sr", days, { one: `za ${days} dan`, few: `za ${days} dana`, other: `za ${days} dana` })
        : plural("sr", hours, { one: `za ${hours} sat`, few: `za ${hours} sata`, other: `za ${hours} sati` }),
    pastMaturity:
      "Ovaj zajam je prošao dospeće: preostali dug može da bude likvidiran u bilo kom trenutku, bez obzira na health factor. Otplati ga da izbegneš likvidaciju.",
    preLiquidation: "Predlikvidacija",
    preLiquidationNote:
      "Na ovom tržištu si uključio predlikvidaciju, pa se health factor meri prema njenoj ranijoj granici: ispod 1 deo tvoje pozicije može da bude prodat.",
    amountsIn: token => `Iznosi su u tokenu ${token}, vrednovani prema oraklu tržišta.`,
    noDebtTitle: "Na ovom tržištu nema duga",
    noDebtDetail: "Sačuvano upozorenje ostaje sačuvano i ne šalje ništa dok nema duga.",
    unreadableTitle: "Ova pozicija nije očitana",
    unreadableDetail: "Mreža nije odgovorila. Tvoje upozorenje se i dalje proverava.",
  },
  paywall: {
    descriptionNew: marketName =>
      `Plati jednom da podesiš upozorenja za health factor ${srOnMarket(marketName, "market")} i na drugim tržištima. Ništa se ne obnavlja automatski: plaćaš iz svog novčanika kad želiš da produžiš.`,
    descriptionExtend: marketName =>
      `Tvoja sačuvana podešavanja upozorenja ${srForMarket(marketName, "market")} su i dalje na tvom nalogu. Plati ponovo da produžiš pristup i izmeniš ih.`,
  },
};
