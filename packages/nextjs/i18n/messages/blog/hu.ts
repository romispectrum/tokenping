import type { BlogMessages } from "./shared";
// The alert price ("3 USDC 30 napra" or the fallback) stands where a bare noun phrase reads: "A riasztások ára: ...".
import { formatDecimal, huOnMarket } from "~~/i18n/format";

/** ", a fizetés az Arbitrum hálózaton történik", or nothing when no network takes payments. */
const paidOn = (paymentChain?: string) =>
  paymentChain ? `, a fizetés ${huOnMarket(paymentChain, "network")} történik` : "";

export const MESSAGES: BlogMessages = {
  crumbs: { home: "Főoldal", blog: "Blog" },
  index: {
    title: "Aave és Morpho health factor- és likvidálási útmutatók",
    description:
      "Aave és Morpho útmutatók: health factor, likvidálás, likvidálási ár és riasztások, kidolgozott példákkal és dátummal, forrással ellátott adatokkal.",
    kicker: "Aave- és Morpho-útmutatók",
    lead: "Hogyan működik a health factor az Aave-on és a Morphón, mi történik likvidáláskor, hogyan számolod ki a likvidálási árat, és hogyan kapsz figyelmeztetést, mielőtt az ár közel kerül hozzá. Az útmutatók minden adatánál ott a forrás és az ellenőrzés dátuma.",
    dashboardCta: "Az Aave irányítópult megnyitása",
    morphoDashboardCta: "A Morpho irányítópult megnyitása",
    rss: "Feliratkozás RSS-en",
    startHere: "Kezdd itt",
    allGuides: "Minden útmutató",
    empty: {
      title: "Még nincs útmutató",
      description: "Az útmutatók magyar változata készül. Iratkozz fel RSS-en, és megkapod őket, amint megjelennek.",
      otherLanguage: "Az útmutatók angolul",
    },
  },
  post: {
    kicker: "Aave V3 útmutató",
    morphoKicker: "Morpho-útmutató",
    byline: { author: "A Tokenping csapata", published: "Megjelent", updated: "Frissítve" },
    readingTime: minutes => `Olvasási idő: ${minutes} perc`,
    readGuide: "Az útmutató elolvasása",
    related: "Kapcsolódó útmutatók",
  },
  endBox: {
    label: "A Tokenpingről",
    title: "Health factor-riasztások a Tokenpingtől",
    body: ({ minutes, networks, channels, price, paymentChain }) =>
      `A Tokenping ${minutes} percenként ellenőrzi az Aave V3 és V4 health factorodat ${networks} hálózaton, és üzenetet küld a következő csatornán: ${channels}, ha a küszöbértéked alá esik. A riasztások ára: ${price}${paidOn(paymentChain)}. A pozícióid megtekintéséért nem kell fizetned. A riasztások időt adnak a cselekvésre, a likvidálást nem akadályozzák meg.`,
    cta: "Az irányítópult megnyitása",
    morpho: {
      title: "Morpho health factor-riasztások a Tokenpingtől",
      body: ({ minutes, networks, channels, price, paymentChain }) =>
        `A Tokenping ${minutes} percenként ellenőrzi a Morpho Blue és Midnight health factorodat ${networks} hálózaton, és üzenetet küld a következő csatornán: ${channels}, ha a küszöbértéked alá esik. Egy fix kamatozású hitel lejárata előtt emlékeztetőt is küld. A riasztások ára: ${price}${paidOn(paymentChain)}, ugyanaz a csomag, mint az Aave-riasztásoké. A pozícióid megtekintéséért nem kell fizetned. A riasztások időt adnak a cselekvésre, a likvidálást nem akadályozzák meg.`,
      cta: "A Morpho irányítópult megnyitása",
    },
  },
  alertPrice: {
    fallback: "kis összegű USDC-díj (az aktuális árat az irányítópulton látod)",
    plan: ({ priceLabel, days }) =>
      days === 1 ? `napi ${formatDecimal("hu", priceLabel)}` : `${formatDecimal("hu", priceLabel)} ${days} napra`,
  },
  callout: { info: "Megjegyzés", warning: "Figyelem" },
  shortAnswer: "Röviden",
  scopeNote: {
    text: "Az Aave V3.7-re vonatkozik, az Ethereum Core, Arbitrum, Base, Optimism, Polygon, Avalanche és Gnosis piacon ellenőrizve. Más V3-piacok és hálózatok régebbi verziót futtathatnak. Ahol az Aave V4 szabályai eltérnek, azt jelezzük.",
    morphoText:
      "A Morpho alkalmazásban listázott Morpho Blue és Morpho Midnight piacokra vonatkozik. Minden piac maga határozza meg a fedezetet, az orákulumot és az LLTV-t, ezért a saját piacod adatait ellenőrizd.",
    figuresAsOf: "Az adatok dátuma:",
  },
  table: {
    fallbackLabel: "Táblázat, vízszintesen görgethető",
    label: (heading, index) => (index === undefined ? `Táblázat: ${heading}` : `${index}. táblázat: ${heading}`),
    scrollHint: "Görgess oldalra az összes oszlop megtekintéséhez.",
  },
};
