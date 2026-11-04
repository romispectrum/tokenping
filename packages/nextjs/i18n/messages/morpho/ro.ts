import type { MorphoMessages } from "./shared";
import { plural, roForMarket, roOnMarket } from "~~/i18n/format";

export const MESSAGES: MorphoMessages = {
  page: {
    metaTitle: "Alerte de health factor pentru Morpho Blue și Midnight",
    metaDescription: (networkCount, channels) =>
      `Alerte de health factor pentru împrumuturi Morpho Blue și Midnight prin ${channels}, pe ${plural(
        "ro",
        networkCount,
        {
          one: `${networkCount} rețea`,
          few: `${networkCount} rețele`,
          other: `${networkCount} de rețele`,
        },
      )}, cu mementouri înainte de scadență.`,
    title: "Morpho Blue și Midnight: poziții și alerte de health factor",
    intro: networks =>
      `Pozițiile tale de împrumut din piețele listate în aplicația Morpho, pe ${networks}: împrumuturi cu dobândă variabilă (Morpho Blue) și împrumuturi cu dobândă fixă (Morpho Midnight). Health factor-ul este citit din blockchain.`,
    checks: minutes =>
      `Alertele sunt verificate ${plural("ro", minutes, {
        one: "în fiecare minut",
        few: `la fiecare ${minutes} minute`,
        other: `la fiecare ${minutes} de minute`,
      })}. Un împrumut cu dobândă fixă primește și un memento cu 7 zile și cu 1 zi înainte de scadență, iar după scadență o alertă la fiecare verificare cât timp rămâne datorie.`,
    access: "O singură plată pentru acces acoperă alertele tale pentru Aave și Morpho.",
    notAffiliated: "Tokenping nu este afiliat cu Morpho.",
    guideHealthFactor: "Cum funcționează health factor-ul pe Morpho",
    guideLiquidation: "Cum funcționează lichidarea pe Morpho",
    guideMidnight: "Împrumuturi cu dobândă fixă pe Morpho Midnight",
    aaveDashboard: "Te împrumuți pe Aave? Deschide panoul Aave",
  },
  positionsHeading: "Pozițiile tale Morpho",
  gate: {
    title: "Conectează un portofel ca să continui",
    description:
      "Tokenping are nevoie de adresa portofelului tău ca să-ți găsească pozițiile Morpho. Conectarea nu mută fonduri și nu costă nimic.",
    connect: "Conectează portofelul",
    connecting: "Se conectează",
    approveInWallet: "Aprobă conectarea în portofel.",
  },
  list: {
    heading: "Piețe",
    count: count => `${count} cu datorie`,
    none: "Nu am găsit împrumuturi în piețele listate în aplicația Morpho.",
    discoveryFailed: "API-ul Morpho nu a răspuns, așa că sunt listate doar piețele cu o alertă salvată.",
    variableRate: "Dobândă variabilă",
    fixedRate: "Dobândă fixă",
    matures: date => `Scadență: ${date}`,
    matured: "Scadență depășită",
    unreadable: "Nu a putut fi citită",
    retry: market => `Citește din nou ${market}`,
    noneSelectedDescription: "Alege o piață ca să vezi poziția Morpho.",
  },
  details: {
    collateralValue: "Valoarea garanției",
    debt: "Datorie",
    ltv: "LTV",
    lltv: "LTV de lichidare",
    maturity: "Scadență",
    timeLeft: (days, hours) =>
      days > 0
        ? plural("ro", days, { one: "peste 1 zi", few: `peste ${days} zile`, other: `peste ${days} de zile` })
        : plural("ro", hours, { one: "peste 1 oră", few: `peste ${hours} ore`, other: `peste ${hours} de ore` }),
    pastMaturity:
      "Acest împrumut a depășit scadența: orice datorie rămasă poate fi lichidată oricând, indiferent de health factor. Rambursează-l ca să eviți lichidarea.",
    preLiquidation: "Pre-lichidare",
    preLiquidationNote:
      "Ai ales pre-lichidarea pe această piață, așa că health factor-ul este măsurat față de pragul ei, atins mai devreme: sub 1, o parte din poziția ta poate fi vândută.",
    amountsIn: token => `Sumele sunt în ${token}, evaluate de oracolul pieței.`,
    noDebtTitle: "Nicio datorie pe această piață",
    noDebtDetail: "O alertă salvată rămâne salvată și nu trimite nimic cât timp nu există datorie.",
    unreadableTitle: "Această poziție nu a putut fi citită",
    unreadableDetail: "Rețeaua nu a răspuns. Alerta ta continuă să fie verificată.",
  },
  paywall: {
    descriptionNew: marketName =>
      `Plătești o singură dată ca să setezi alerte de health factor ${roOnMarket(marketName, "market")} și pe alte piețe. Nimic nu se reînnoiește automat: plătești din portofel când vrei să prelungești.`,
    descriptionExtend: marketName =>
      `Setările alertei salvate ${roForMarket(marketName, "market")} sunt încă în contul tău. Plătește din nou ca să prelungești accesul și să le editezi.`,
  },
};
