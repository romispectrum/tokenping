import type { CalculatorMessages } from "./shared";
import { joinList } from "~~/i18n/format";

// The calculator reads and shows numbers the app's way (a decimal point, "$2,400.00"), so the examples, hints and
// results keep the decimal point and group thousands with a space, which reads the same either way. "1.00" is
// followed by a noun ("1.00 değerinin altında") so no suffix has to agree with how the number is read.
export const MESSAGES: CalculatorMessages = {
  title: "Aave likidasyon fiyatı hesaplayıcı",
  intro:
    "Sağlık faktörünü ve pozisyonun likide edilebileceği fiyatları görmek için her teminat varlığını ve borcunuzu girin. Hesaplayıcı Aave V3 formülünü kullanır: Σ(teminat değeri × likidasyon eşiği) ÷ borç değeri.",
  examplesLabel: "Hesaplanmış bir örnek yükleyin:",
  examples: {
    "one-collateral": "10 WETH, 12 000 USDC borç",
    "two-collaterals": "10 WETH + 0.2 WBTC, 20 000 USDC borç",
    "volatile-debt": "10 000 USDC, borç alınan 2.5 WETH",
  },
  defaultCollateralName: index => `Teminat ${index}`,
  defaultDebtName: "Borç varlığı",
  collateralLegend: index => `Teminat ${index}`,
  presetLabel: "Aave V3 varlığı (eşiği doldurur)",
  eModeHint: (collateral, borrowable) =>
    `Bu eşik ${joinList("tr", collateral)} için geçerlidir; diğer teminatlar kendi eşiğini korur. Bu E-Mode kategorisinde yalnızca şunları borç alabilirsiniz: ${joinList("tr", borrowable)}.`,
  otherAsset: "Başka bir varlık: eşiği kendiniz girin",
  presetGroup: (market, date) => `${market} (${date} tarihinde okundu)`,
  presetLabels: {
    "ethereum-core-emode-eth": "E-Mode “ETH correlated” (ör. WETH, wstETH, weETH)",
  },
  nameLabel: "Varlık adı",
  namePlaceholder: symbols => `ör. ${symbols.join(" veya ")}`,
  amountSupplied: "Yatırılan miktar",
  price: "Fiyat (USD)",
  priceHint: "Aave'nin oracle fiyatı; Aave uygulamasında varlığın sayfasında gösterilir.",
  threshold: "Likidasyon eşiği (%)",
  thresholdHint: "E-Mode kullanılıyorsa kategorinin eşiği. Aave V4'te collateral factor.",
  removeCollateral: index => `${index}. teminatı kaldır`,
  addCollateral: "İkinci bir teminat ekle",
  debtLegend: "Borç",
  debtKindLegend: "Ne borç aldınız?",
  debtKinds: { stable: "Bir stablecoin ($1.00 olarak sayılır)", volatile: "Fiyatı değişken bir varlık, örneğin WETH" },
  debtAmount: { stable: "Borç alınan tutar (USD)", volatile: "Borç alınan miktar (token)" },
  debtAmountHint: "Şimdiye kadar biriken faizi de ekleyin.",
  debtPrice: "Borç alınan varlığın fiyatı (USD)",
  errors: {
    number: "10 veya 0.25 gibi bir sayı girin; ondalık ayırıcı olarak nokta kullanın.",
    price: "0'dan büyük bir fiyat girin.",
    threshold: "0'dan büyük ve en fazla 100 olan bir yüzde girin.",
    samePrice: (name, price) =>
      `${name} yukarıda zaten ${price} fiyatıyla girildi. Aynı fiyatı kullanın: bir varlığın tek bir fiyatı vardır.`,
  },
  eModeLead: "Sonuç yok: Aave bu kombinasyona izin vermiyor.",
  eModeConflict: ({ market, category, borrowable, loan, thresholdPercent, ownThresholds }) => {
    const borrowableList = joinList("tr", borrowable);
    const loanText = loan.kind === "stable" ? "stablecoin borcu olan" : `${loan.name} borcu olan`;
    const own = ownThresholds.length ? ` (${ownThresholds.join(", ")})` : "";
    return (
      `${market} piyasasındaki “${category}” E-Mode kategorisi yalnızca şunları borç almanıza izin verir: ${borrowableList}. ` +
      `Bu yüzden ${loanText} bir hesap bu kategorinin %${thresholdPercent} eşiğini kullanamaz. Bunun yerine teminatın kendi eşiğini seçin${own} veya şunlardan birini borç alın: ${borrowableList}.`
    );
  },
  results: {
    heading: "Sonuç",
    empty: "Sonucu görmek için her alana bir sayı girin.",
    summaryLine: (title, value) => `${title}: ${value}.`,
    healthFactor: "Sağlık faktörü",
    noDebt: "Borç yok, bu yüzden likide edilecek bir şey yok.",
    liquidatableNow: "1.00 değerinin altında: pozisyon şu anda likide edilebilir.",
    liquidatableBelow: "Pozisyon 1.00 değerinin altında likide edilebilir.",
    none: "Yok",
    priceTitle: name => `${name} likidasyon fiyatı`,
    priceTitleBorrowed: name => `${name} likidasyon fiyatı (borç alınan)`,
    priceTitleShared: name => `${name} likidasyon fiyatı (yatırılan ve borç alınan)`,
    recover: ({ name, change, now, rises, alike }) =>
      `Diğer fiyatlar değişmezse, ${name} fiyatı${alike ? " (yatırılan ve borç alınan için aynı)" : ""} ${now} seviyesinden ${change} ${
        rises ? "yükseldiğinde" : "düştüğünde"
      } sağlık faktörü yeniden 1.00 değerine ulaşır.`,
    collateralFall: ({ change, now }) => `${now} seviyesinin ${change} altında, diğer tüm fiyatlar aynı kalırsa.`,
    collateralNone: name =>
      `${name} fiyatı $0 olsa bile tek başına sağlık faktörünü 1.00 değerinin altına düşüremez: diğer teminat borcu karşılar.`,
    debtRise: ({ change, now }) =>
      `${now} seviyesinin ${change} üstünde: borç alınan varlıkların fiyatı yükseldikçe sağlık faktörü düşer.`,
    sharedRise: ({ name, change, now }) =>
      `${now} seviyesinin ${change} üstünde: ${name} borcunuz, ${name} teminatınızın hesaba katılan kısmından fazla, bu yüzden bir yükseliş sağlık faktörünü düşürür. Diğer fiyatlar sabit.`,
    sharedFallBorrowed: ({ name, change, now }) =>
      `${now} seviyesinin ${change} altında; borç alınan ${name} aynı fiyatta ve diğer tüm fiyatlar sabitken.`,
    sharedFallRows: ({ name, change, now }) =>
      `Her ${name} satırı için ${now} seviyesinin ${change} altında, diğer tüm fiyatlar aynı kalırsa.`,
    bothSidesNeutral: name =>
      `${name} hem teminatınız hem borcunuz; ikisi birlikte hareket eder ve bu varlığın fiyatı sağlık faktörünü değiştirmez. Faiz, bir eşik değişikliği veya kendi işlemleriniz ise yine değiştirir.`,
    bothSidesRecover: name =>
      `${name} iki tarafta da var, ikisi birlikte hareket eder: hiçbir ${name} fiyatı tek başına sağlık faktörünü yeniden 1.00 değerine getirmez.`,
    bothSidesSafe: name =>
      `${name} iki tarafta da var, ikisi birlikte hareket eder: bu varlığın fiyatı tek başına sağlık faktörünü 1.00 değerinin altına düşüremez.`,
    uniformTitle: "Tüm teminat birlikte düşerse",
    uniformDescription: prices =>
      `Her teminatın fiyatı bu kadar düşer ve borcun fiyatı değişmezse sağlık faktörü 1.00 değerine ulaşır: ${prices
        .map(({ name, price }) => `${name} için ${price}`)
        .join(" ve ")}.`,
    ratioTitle: (numerator, denominator) => `Likidasyonda ${numerator} ÷ ${denominator} fiyat oranı`,
    ratioDescription: (now, change, falls) =>
      `Şu an ${now}. İki fiyat da hareket ederse bu oranda ${change} ${falls ? "düşüş" : "yükseliş"} sağlık faktörünü 1.00 değerine getirir.`,
    breakdown: ({ collateral, weighted, debt, healthFactor }) =>
      `Teminat ${collateral}, likidasyon eşikleriyle hesaba katıldığında: ${weighted}. Sağlık faktörü = ${weighted} ÷ ${debt} borç = ${healthFactor}.`,
  },
  noscript:
    "Hesaplayıcının yeniden hesaplamak için JavaScript'e ihtiyacı var. Yukarıdaki sonuç, 12 000 USDC borca karşı $2 400 fiyatlı 10 WETH (likidasyon eşiği %83) içindir; bu sayfadaki hesaplanmış örnekler aynı formülü kullanır.",
  disclaimer: {
    lead: "Eğitim amaçlı bir tahmindir, finansal tavsiye değildir.",
    beforeDate:
      "Yalnızca girdiğiniz sayıları kullanır. Aave'nin güncel parametreleri değişebilir: yukarıdaki eşikler zincir üzerinden",
    afterDate:
      " tarihinde okundu ve governance veya Risk Stewards bunları her an değiştirebilir. Oracle fiyatları değişir, faiz borcunuza eklenmeye devam eder ve her likidasyon fiyatı diğer tüm fiyatların aynı kaldığını varsayar. Harekete geçmeden önce pozisyonunuzu Aave uygulamasında kontrol edin.",
  },
};
