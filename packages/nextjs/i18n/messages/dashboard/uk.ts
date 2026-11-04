import type { DashboardMessages } from "./shared";
import { formatDecimal, plural, ukForMarket, ukOnMarket } from "~~/i18n/format";

/** "1 день", "2 дні", "30 днів", "21 день". */
const days = (count: number) =>
  plural("uk", count, {
    one: `${count} день`,
    few: `${count} дні`,
    many: `${count} днів`,
    other: `${formatDecimal("uk", count)} дня`,
  });

/** "кожні 5 хвилин", "кожні 2 хвилини", "щохвилини". */
const everyMinutes = (minutes: number) =>
  minutes === 1
    ? "щохвилини"
    : plural("uk", minutes, {
        one: `кожні ${minutes} хвилину`,
        few: `кожні ${minutes} хвилини`,
        many: `кожні ${minutes} хвилин`,
        other: `кожні ${formatDecimal("uk", minutes)} хвилини`,
      });

/** "у 29 мережах", "у 21 мережі". */
const onNetworks = (count: number) => plural("uk", count, { one: `у ${count} мережі`, other: `у ${count} мережах` });

export const MESSAGES: DashboardMessages = {
  page: {
    metaTitle: "Позиції та health factor в Aave V3 і V4",
    metaDescription: (networkCount, channels) =>
      `Переглядайте заставу, борг і health factor в Aave V3 і V4 ${onNetworks(networkCount)} і налаштуйте сповіщення через ${channels}, один поріг на ринок.`,
    title: "Позиції в Aave V3 і V4 та сповіщення про health factor",
    networkMarkets: (name, markets) => `${name} (ринки ${markets})`,
    intro: (v3Networks, v4Networks) =>
      `Підключіть гаманець, з якого ви позичаєте, щоб побачити його заставу, борг і health factor в Aave V3 у цих мережах: ${v3Networks}, а також у кожному Spoke Aave V4 у цих мережах: ${v4Networks}. Для перегляду не потрібна жодна транзакція.`,
    disclosureSummary: "Скільки коштують сповіщення і як часто ми перевіряємо",
    alertsCost: (channels, paymentChain) =>
      `Щоб отримувати повідомлення через ${channels}, коли health factor ринку падає нижче обраного вами порогу, відкрийте сповіщення оплатою в USDC${paymentChain ? ` ${ukOnMarket(paymentChain, "network")}` : ""}. Поточну ціну ви побачите перед оплатою.`,
    checks: minutes =>
      `Tokenping перевіряє ${everyMinutes(minutes)}. Поки health factor лишається нижче вашого порогу, кожна перевірка надсилає нове повідомлення в кожен обраний вами канал.`,
    guideThreshold: "Як вибрати поріг",
    guideAlerts: "Як працюють сповіщення",
    morphoDashboard: "Позичаєте в Morpho? Відкрити панель Morpho",
  },
  gate: {
    title: "Підключіть гаманець, щоб продовжити",
    description:
      "Tokenping потрібна адреса вашого гаманця, щоб показати ваші позиції в Aave. Підключення не переміщує кошти і не стягує комісію.",
    connect: "Підключити гаманець",
    connecting: "Підключення",
    approveInWallet: "Підтвердьте підключення у своєму гаманці.",
  },
  positionsHeading: "Ваші позиції в Aave",
  loadingDashboard: "Завантаження панелі",
  toolbar: {
    wallet: "Гаманець",
    refresh: "Оновити позиції",
    refreshing: "Оновлення",
    loadingPositions: "Завантаження позицій",
  },
  errors: {
    positionsDidNotLoad: "Позиції не завантажилися",
    refreshFailed: "Не вдалося оновити",
    showingLastPositions: "Показано позиції з останнього успішного завантаження.",
    tryAgain: "Спробувати ще раз",
    fetchPositionsFailed: "Не вдалося отримати позиції в Aave",
  },
  totals: {
    supplied: "Усього внесено",
    borrowed: "Усього позичено",
    netWorth: "Чиста вартість",
    noData: "Немає даних",
  },
  networks: {
    heading: "Ринки",
    active: count => `Активних: ${count}`,
    noPositions: "На підтримуваних ринках не знайдено активних позицій в Aave.",
    selectedRegion: "Вибраний ринок",
    noneSelectedTitle: "Ринок не вибрано",
    noneSelectedDescription: "Виберіть ринок, щоб побачити свою позицію в Aave.",
    otherMarkets: count => `Інші ринки (${count})`,
    otherMarketsHint: "Ринки, які перевірив Tokenping і де цей гаманець не має ні позиції, ні сповіщення.",
    alertSet: "Сповіщення налаштовано",
    supplied: usd => `внесено ${usd},`,
    borrowed: usd => `позичено ${usd}`,
    noPosition: "Немає позиції",
  },
  healthFactor: {
    srPrefix: "Health factor ",
    noDebt: "Немає боргу",
    critical: "Критично",
    risky: "Ризиковано",
    safe: "Безпечно",
  },
  position: {
    market: version => (version === 4 ? "Spoke Aave V4" : "Ринок Aave V3"),
    noPositionTitle: chainName => `Немає активної позиції ${ukOnMarket(chainName)}`,
    noPositionDetail: chainName => `Aave не показує ні застави, ні боргу для цього гаманця ${ukOnMarket(chainName)}.`,
    collateral: "Застава",
    debt: "Борг",
    netWorth: "Чиста вартість",
    suppliedTitle: "Внесено",
    borrowedTitle: "Позичено",
    noCollateral: "Застави не внесено",
    noDebt: "Непогашеного боргу немає",
    tokenIconsFrom: "Іконки токенів і мереж:",
    tokenDetailsFailedTitle: "Дані про токени не завантажилися",
    tokenDetailsFailedBody: "Підсумки вище взято зі зведення рахунку Aave. Оновіть позиції, щоб спробувати ще раз.",
  },
  tokens: {
    asset: "Актив",
    supplied: "Внесено",
    supplyApy: "APY депозиту",
    collateral: "Застава",
    borrowed: "Позичено",
    rateType: "Тип ставки",
    enabled: "Увімкнено",
    disabled: "Вимкнено",
    stable: amount => `Стабільна ${amount}`,
    variable: amount => `Змінна ${amount}`,
    count: count =>
      plural("uk", count, {
        one: `${count} актив`,
        few: `${count} активи`,
        many: `${count} активів`,
        other: `${count} активу`,
      }),
  },
  address: {
    defaultLabel: "Адреса",
    copy: (_label, address) => `Копіювати адресу ${address}`,
    copied: "Адресу скопійовано",
    copyFailed: "Не вдалося скопіювати. Виділіть адресу і скопіюйте її вручну.",
  },
  opensInNewTab: "(відкривається в новій вкладці)",
  paywall: {
    unlockedUntil: date => `Сповіщення відкрито до ${date}`,
    titleNew: "Відкрити сповіщення про health factor",
    titleExtend: "Продовжити доступ, щоб змінювати сповіщення",
    descriptionNew:
      "Оплатіть один раз, щоб відкрити налаштування сповіщень і задати поріг health factor для кожної мережі. Нічого не поновлюється автоматично: ви платите зі свого гаманця, коли хочете продовжити.",
    descriptionExtend:
      "Ваші попередні налаштування сповіщень збережено. Оплатіть знову, щоб продовжити доступ і змінити їх.",
    networkDescriptionNew: chainName =>
      `Оплатіть один раз, щоб налаштувати сповіщення про health factor ${ukOnMarket(chainName)} та на інших ринках. Нічого не поновлюється автоматично: ви платите зі свого гаманця, коли хочете продовжити.`,
    networkDescriptionExtend: chainName =>
      `Ваші збережені налаштування сповіщень ${ukForMarket(chainName)} досі є у вашому акаунті. Оплатіть знову, щоб продовжити доступ і змінити їх.`,
    connectWallet: "Підключіть гаманець, щоб оплатити доступ.",
    unconfigured: "Платіжний контракт не налаштовано для цієї мережі.",
    noPlan: "Зараз немає доступного платного плану.",
    paused: "Платежі зараз призупинено. Спробуйте пізніше.",
    statusUnavailable: "Не вдалося завантажити статус оплати. Перезавантажте сторінку, щоб спробувати ще раз.",
    wrongNetworkTitle: "Неправильна мережа",
    wrongNetworkBody: (walletChain, target) =>
      `Ваш гаманець ${walletChain ? ukOnMarket(walletChain, "network") : "в іншій мережі"}. Щоб оплатити, перейдіть ${target ? `у мережу ${target}` : "у мережу для оплати"}.`,
    switchTo: target => `Перейти ${target ? `у мережу ${target}` : "у мережу для оплати"}`,
    switching: "Зміна мережі",
    loadingDetails: "Завантаження даних оплати",
    price: "Ціна",
    access: "Доступ",
    network: "Мережа",
    networkFee: "Комісія мережі",
    networkFeeValue: symbol => `Сплачується в ${symbol} за кожен крок, показано у вашому гаманці`,
    period: (count, about) => (about ? `Близько ${days(count)}` : days(count)),
    pay: amount => `Сплатити ${amount}`,
    extend: (count, amount) => `Додати ${days(count)} за ${amount}`,
    extendHint: count =>
      `Кожна оплата додає ${days(count)} після вашої поточної дати завершення. Платіть скільки завгодно разів; ніщо не поновлюється само.`,
    accessExtended: date => `Доступ продовжено до ${date}.`,
    accessActive: "Доступ активний. Тепер ви можете налаштувати сповіщення.",
    paymentPending: "Оплату підтверджено. Доступ незабаром з'явиться.",
    loading: {
      processing: "Обробка",
      waitingForWallet: "Очікування вашого гаманця",
      approving: "Підтвердження дозволу",
      paying: "Оплата",
    },
    unavailable: "Платний доступ зараз недоступний.",
    checkFailed: "Не вдалося перевірити статус оплати. Спробуйте ще раз за хвилину.",
    approvalNotVisible: "Дозвіл підтверджено, але його ще не видно. Спробуйте ще раз за хвилину.",
  },
  payment: {
    stepsLabel: "Кроки оплати",
    approveTitle: amount => `Дозволити ${amount}`,
    approveHint:
      "Дозволяє платіжному контракту списати рівно цю суму. Пропускається, якщо її покриває попередній дозвіл.",
    payTitle: amount => `Сплатити ${amount}`,
    payHint: "Надсилає оплату і відкриває сповіщення.",
    inProgress: "Виконується",
    done: "Готово",
    notNeeded: "Не потрібно",
    transaction: "Транзакція ",
    viewOn: explorer => `Переглянути на сайті ${explorer}`,
    preparingTitle: "Підготовка оплати",
    preparingBody: "Перевіряємо поточну ціну і ваш дозвіл.",
    confirmTitle: "Підтвердьте у гаманці",
    approveSignBody: amount => `Крок 1 з 2: дозвольте ${amount}. Нічого не надсилається, доки ви не підтвердите.`,
    processingOn: network => (network ? `Обробка ${ukOnMarket(network, "network")}` : "Обробка в мережі"),
    approvePendingBody: "Крок 1 з 2: дозвіл надіслано. Далі гаманець попросить вас підтвердити оплату.",
    paySignBody: amount => `Крок 2 з 2: сплатіть ${amount}. Нічого не надсилається, доки ви не підтвердите.`,
    payPendingBody: "Крок 2 з 2: оплату надіслано. Сповіщення відкриються, щойно мережа її підтвердить.",
  },
};
