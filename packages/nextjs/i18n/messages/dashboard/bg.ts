import type { DashboardMessages } from "./shared";
import { bgForMarket, bgOnMarket, plural } from "~~/i18n/format";

/** "1 ден", "30 дни". */
const days = (count: number) => plural("bg", count, { one: `${count} ден`, other: `${count} дни` });

export const MESSAGES: DashboardMessages = {
  page: {
    metaTitle: "Позиции и health factor в Aave V3 и V4",
    metaDescription: (networkCount, channels) =>
      `Вижте обезпечението, дълга и health factor си в Aave V3 и V4 ${plural("bg", networkCount, { one: `в ${networkCount} мрежа`, other: `в ${networkCount} мрежи` })}, после задайте известия чрез ${channels}, по един праг на пазар.`,
    title: "Позиции в Aave V3 и V4 и известия за health factor",
    networkMarkets: (name, markets) => `${name} (пазари ${markets})`,
    intro: (v3Networks, v4Networks) =>
      `Свържете портфейла, с който заемате, за да видите неговото обезпечение, дълг и health factor в Aave V3 в мрежите ${v3Networks} и във всеки Spoke на Aave V4 в мрежите ${v4Networks}. Разглеждането не изисква транзакция.`,
    disclosureSummary: "Колко струват известията и колко често проверяваме",
    alertsCost: (channels, paymentChain) =>
      `За да получавате съобщение чрез ${channels}, когато health factor на някой пазар падне под избран от вас праг, отключете известията с плащане в USDC${paymentChain ? ` в мрежата ${paymentChain}` : ""}. Текущата цена се показва, преди да платите.`,
    checks: (minutes, repeatMinutes) =>
      `Tokenping проверява ${minutes === 1 ? "на всяка минута" : `на всеки ${minutes} минути`}. Докато health factor остава под вашия праг, получавате съобщение на всеки ${repeatMinutes} минути във всеки избран от вас канал.`,
    guideThreshold: "Как да изберете праг",
    guideAlerts: "Как работят известията",
    morphoDashboard: "Заемате в Morpho? Отворете таблото за Morpho",
  },
  gate: {
    title: "Свържете портфейл, за да продължите",
    description:
      "Tokenping се нуждае от адреса на портфейла ви, за да покаже позициите ви в Aave. Свързването не мести средства и не струва такса.",
    connect: "Свържете портфейла",
    connecting: "Свързваме",
    approveInWallet: "Одобрете връзката в портфейла си.",
  },
  positionsHeading: "Вашите позиции в Aave",
  loadingDashboard: "Зареждаме таблото",
  toolbar: {
    wallet: "Портфейл",
    refresh: "Обновяване на позициите",
    refreshing: "Обновяваме",
    loadingPositions: "Зареждаме позициите",
  },
  errors: {
    positionsDidNotLoad: "Позициите не се заредиха",
    refreshFailed: "Обновяването не успя",
    showingLastPositions: "Показваме позициите от последното успешно зареждане.",
    tryAgain: "Опитайте отново",
    fetchPositionsFailed: "Позициите в Aave не можаха да бъдат извлечени",
  },
  totals: {
    supplied: "Общо внесено",
    borrowed: "Общо заето",
    netWorth: "Нетна стойност",
    noData: "Няма данни",
  },
  networks: {
    heading: "Пазари",
    active: count => plural("bg", count, { one: `${count} активен`, other: `${count} активни` }),
    noPositions: "Не са открити активни позиции в Aave на поддържаните пазари.",
    selectedRegion: "Избран пазар",
    noneSelectedTitle: "Няма избран пазар",
    noneSelectedDescription: "Изберете пазар, за да видите позицията си в Aave.",
    otherMarkets: count => `Други пазари (${count})`,
    otherMarketsHint: "Пазари, проверени от Tokenping, на които този портфейл няма позиция и известие.",
    alertSet: "Известието е зададено",
    supplied: usd => `внесено ${usd},`,
    borrowed: usd => `заето ${usd}`,
    noPosition: "Няма позиция",
  },
  healthFactor: {
    srPrefix: "Health factor ",
    noDebt: "Няма дълг",
    critical: "Критичен",
    risky: "Рисков",
    safe: "Безопасен",
  },
  position: {
    market: version => (version === 4 ? "Spoke на Aave V4" : "Пазар на Aave V3"),
    noPositionTitle: chainName => `Няма активна позиция ${bgOnMarket(chainName)}`,
    noPositionDetail: chainName => `Aave не отчита обезпечение и дълг за този портфейл ${bgOnMarket(chainName)}.`,
    collateral: "Обезпечение",
    debt: "Дълг",
    netWorth: "Нетна стойност",
    suppliedTitle: "Внесено",
    borrowedTitle: "Заето",
    noCollateral: "Няма внесено обезпечение",
    noDebt: "Няма непогасен дълг",
    tokenIconsFrom: "Икони на токени и мрежи от",
    tokenDetailsFailedTitle: "Подробностите за токените не се заредиха",
    tokenDetailsFailedBody:
      "Сумите по-горе идват от обобщението на акаунта в Aave. Обновете позициите, за да опитате отново.",
  },
  tokens: {
    asset: "Актив",
    supplied: "Внесено",
    supplyApy: "APY при внасяне",
    collateral: "Обезпечение",
    borrowed: "Заето",
    rateType: "Вид лихва",
    enabled: "Включено",
    disabled: "Изключено",
    stable: amount => `Стабилна ${amount}`,
    variable: amount => `Променлива ${amount}`,
    count: count => plural("bg", count, { one: `${count} актив`, other: `${count} актива` }),
  },
  address: {
    defaultLabel: "Адрес",
    copy: (_label, address) => `Копиране на адреса ${address}`,
    copied: "Адресът е копиран",
    copyFailed: "Копирането не успя. Маркирайте адреса и го копирайте ръчно.",
  },
  opensInNewTab: "(отваря се в нов раздел)",
  paywall: {
    unlockedUntil: date => `Известията са отключени до ${date}`,
    titleNew: "Отключете известията за health factor",
    titleExtend: "Удължете достъпа, за да редактирате известията си",
    descriptionNew:
      "Платете веднъж, за да отключите настройките на известията и да зададете праг на health factor за всяка мрежа. Нищо не се подновява автоматично: плащате от портфейла си, когато искате да удължите достъпа.",
    descriptionExtend:
      "Предишните ви настройки на известията са запазени. Платете отново, за да удължите достъпа и да ги редактирате.",
    networkDescriptionNew: chainName =>
      `Платете веднъж, за да зададете известия за health factor ${bgOnMarket(chainName)} и на други пазари. Нищо не се подновява автоматично: плащате от портфейла си, когато искате да удължите достъпа.`,
    networkDescriptionExtend: chainName =>
      `Запазените ви настройки на известията ${bgForMarket(chainName)} все още са в акаунта ви. Платете отново, за да удължите достъпа и да ги редактирате.`,
    connectWallet: "Свържете портфейла си, за да платите за достъп.",
    unconfigured: "Контрактът за плащане не е конфигуриран за тази мрежа.",
    noPlan: "В момента няма наличен платен план.",
    paused: "Плащанията са спрени в момента. Опитайте по-късно.",
    statusUnavailable: "Състоянието на плащането не можа да се зареди. Презаредете страницата, за да опитате отново.",
    wrongNetworkTitle: "Грешна мрежа",
    wrongNetworkBody: (walletChain, target) =>
      `${walletChain ? `Портфейлът ви е в мрежата ${walletChain}.` : "Портфейлът ви е в друга мрежа."} Превключете към ${target ? `мрежата ${target}` : "мрежата за плащане"}, за да платите.`,
    switchTo: target => `Превключване към ${target ? `мрежата ${target}` : "мрежата за плащане"}`,
    switching: "Превключваме мрежата",
    loadingDetails: "Зареждаме данните за плащането",
    price: "Цена",
    access: "Достъп",
    network: "Мрежа",
    networkFee: "Мрежова такса",
    networkFeeValue: symbol => `Плаща се в ${symbol} за всяка стъпка и се показва в портфейла ви`,
    period: (count, about) => (about ? `Около ${days(count)}` : days(count)),
    pay: amount => `Платете ${amount}`,
    extend: (count, amount) => `Добавете ${days(count)} за ${amount}`,
    extendHint: count =>
      `Всяко плащане добавя ${days(count)} след текущата крайна дата. Плащайте колкото пъти искате; нищо не се подновява само.`,
    accessExtended: date => `Достъпът е удължен до ${date}.`,
    accessActive: "Достъпът е активен. Вече можете да настроите известията.",
    paymentPending: "Плащането е потвърдено. Достъпът ще се появи скоро.",
    loading: {
      processing: "Обработваме",
      waitingForWallet: "Изчакваме портфейла ви",
      approving: "Одобряваме",
      paying: "Плащаме",
    },
    unavailable: "Платеният достъп не е наличен в момента.",
    checkFailed: "Състоянието на плащането не можа да бъде проверено. Опитайте отново след малко.",
    approvalNotVisible: "Одобрението е потвърдено, но все още не се вижда. Опитайте отново след малко.",
  },
  payment: {
    stepsLabel: "Стъпки на плащането",
    approveTitle: amount => `Одобрете ${amount}`,
    approveHint:
      "Позволява на контракта за плащане да вземе точно тази сума. Стъпката се пропуска, когато предишно одобрение я покрива.",
    payTitle: amount => `Платете ${amount}`,
    payHint: "Изпраща плащането и отключва известията.",
    inProgress: "В процес",
    done: "Готово",
    notNeeded: "Не е нужно",
    transaction: "Транзакция ",
    viewOn: explorer => `Преглед в ${explorer}`,
    preparingTitle: "Подготвяме плащането",
    preparingBody: "Проверяваме текущата цена и вашето одобрение.",
    confirmTitle: "Потвърдете в портфейла си",
    approveSignBody: amount => `Стъпка 1 от 2: одобрете ${amount}. Нищо не се изпраща, докато не потвърдите.`,
    processingOn: network => (network ? `Обработка в мрежата ${network}` : "Обработка в мрежата"),
    approvePendingBody:
      "Стъпка 1 от 2: одобрението е изпратено. След това портфейлът ви ще поиска да потвърдите плащането.",
    paySignBody: amount => `Стъпка 2 от 2: платете ${amount}. Нищо не се изпраща, докато не потвърдите.`,
    payPendingBody: "Стъпка 2 от 2: плащането е изпратено. Известията се отключват, щом мрежата го потвърди.",
  },
};
