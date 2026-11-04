import type { DashboardMessages } from "./shared";
import { plural, ruForMarket, ruOnMarket } from "~~/i18n/format";

/** "1 день", "2 дня", "30 дней", "21 день". */
const days = (count: number) =>
  plural("ru", count, { one: `${count} день`, few: `${count} дня`, many: `${count} дней`, other: `${count} дня` });

/** After "около", the genitive: "около 1 дня", "около 30 дней". */
const aboutDays = (count: number) => `Около ${plural("ru", count, { one: `${count} дня`, other: `${count} дней` })}`;

/** "каждые 5 минут", "каждые 2 минуты", "каждую минуту". */
const everyMinutes = (minutes: number) =>
  plural("ru", minutes, {
    one: minutes === 1 ? "каждую минуту" : `каждую ${minutes} минуту`,
    few: `каждые ${minutes} минуты`,
    many: `каждые ${minutes} минут`,
    other: `каждые ${minutes} минуты`,
  });

/** "в 29 сетях", "в 21 сети". */
const onNetworks = (count: number) => plural("ru", count, { one: `в ${count} сети`, other: `в ${count} сетях` });

export const MESSAGES: DashboardMessages = {
  page: {
    metaTitle: "Позиции и health factor в Aave V3 и V4",
    metaDescription: (networkCount, channels) =>
      `Смотрите залог, долг и health factor в Aave V3 и V4 ${onNetworks(networkCount)} и настройте оповещения через ${channels}, один порог на рынок.`,
    title: "Позиции в Aave V3 и V4 и оповещения о health factor",
    networkMarkets: (name, markets) => `${name} (рынки ${markets})`,
    intro: (v3Networks, v4Networks) =>
      `Подключите кошелёк, с которого вы берёте заём, чтобы увидеть его залог, долг и health factor в Aave V3 в сетях ${v3Networks}, а также во всех Spoke Aave V4 в сетях ${v4Networks}. Для просмотра транзакция не нужна.`,
    disclosureSummary: "Сколько стоят оповещения и как часто мы проверяем",
    alertsCost: (channels, paymentChain) =>
      `Чтобы получать сообщение через ${channels}, когда health factor рынка опускается ниже выбранного вами порога, откройте доступ к оповещениям оплатой в USDC${paymentChain ? ` ${ruOnMarket(paymentChain, "network")}` : ""}. Текущая цена показывается до оплаты.`,
    checks: minutes =>
      `Tokenping проверяет позиции ${everyMinutes(minutes)}. Пока health factor остаётся ниже вашего порога, каждая проверка отправляет новое сообщение в каждый выбранный вами канал.`,
    guideThreshold: "Как выбрать порог",
    guideAlerts: "Как работают оповещения",
    morphoDashboard: "Берёте заём в Morpho? Открыть панель Morpho",
  },
  gate: {
    title: "Подключите кошелёк, чтобы продолжить",
    description:
      "Tokenping нужен адрес вашего кошелька, чтобы показать ваши позиции в Aave. Подключение не перемещает средства и не стоит комиссии.",
    connect: "Подключить кошелёк",
    connecting: "Подключаем",
    approveInWallet: "Подтвердите подключение в своём кошельке.",
  },
  positionsHeading: "Ваши позиции в Aave",
  loadingDashboard: "Загружаем панель",
  toolbar: {
    wallet: "Кошелёк",
    refresh: "Обновить позиции",
    refreshing: "Обновляем",
    loadingPositions: "Загружаем позиции",
  },
  errors: {
    positionsDidNotLoad: "Позиции не загрузились",
    refreshFailed: "Не удалось обновить",
    showingLastPositions: "Показаны позиции из последней успешной загрузки.",
    tryAgain: "Попробовать ещё раз",
    fetchPositionsFailed: "Не удалось получить позиции в Aave",
  },
  totals: {
    supplied: "Всего внесено",
    borrowed: "Всего занято",
    netWorth: "Чистая стоимость",
    noData: "Нет данных",
  },
  networks: {
    heading: "Рынки",
    active: count =>
      plural("ru", count, {
        one: `${count} активный`,
        few: `${count} активных`,
        many: `${count} активных`,
        other: `${count} активных`,
      }),
    noPositions: "На поддерживаемых рынках не найдено активных позиций в Aave.",
    selectedRegion: "Выбранный рынок",
    noneSelectedTitle: "Рынок не выбран",
    noneSelectedDescription: "Выберите рынок, чтобы увидеть свою позицию в Aave.",
    otherMarkets: count => `Другие рынки (${count})`,
    otherMarketsHint: "Рынки, которые Tokenping проверил и на которых у этого кошелька нет ни позиции, ни оповещения.",
    alertSet: "Оповещение настроено",
    supplied: usd => `внесено ${usd},`,
    borrowed: usd => `занято ${usd}`,
    noPosition: "Нет позиции",
  },
  healthFactor: {
    srPrefix: "Health factor ",
    noDebt: "Нет долга",
    critical: "Критический",
    risky: "Рискованный",
    safe: "Безопасный",
  },
  position: {
    market: version => (version === 4 ? "Spoke в Aave V4" : "Рынок Aave V3"),
    noPositionTitle: chainName => `Нет активной позиции ${ruOnMarket(chainName)}`,
    noPositionDetail: chainName =>
      `Aave не показывает ни залога, ни долга для этого кошелька ${ruOnMarket(chainName)}.`,
    collateral: "Залог",
    debt: "Долг",
    netWorth: "Чистая стоимость",
    suppliedTitle: "Внесено",
    borrowedTitle: "Занято",
    noCollateral: "Залог не внесён",
    noDebt: "Непогашенного долга нет",
    tokenIconsFrom: "Иконки токенов и сетей:",
    tokenDetailsFailedTitle: "Данные о токенах не загрузились",
    tokenDetailsFailedBody: "Итоги выше взяты из сводки счёта Aave. Обновите позиции, чтобы попробовать ещё раз.",
  },
  tokens: {
    asset: "Актив",
    supplied: "Внесено",
    supplyApy: "APY депозита",
    collateral: "Залог",
    borrowed: "Занято",
    rateType: "Тип ставки",
    enabled: "Включён",
    disabled: "Выключен",
    stable: amount => `Стабильная ${amount}`,
    variable: amount => `Переменная ${amount}`,
    count: count =>
      plural("ru", count, {
        one: `${count} актив`,
        few: `${count} актива`,
        many: `${count} активов`,
        other: `${count} актива`,
      }),
  },
  address: {
    defaultLabel: "Адрес",
    copy: (_label, address) => `Скопировать адрес ${address}`,
    copied: "Адрес скопирован",
    copyFailed: "Не удалось скопировать. Выделите адрес и скопируйте его вручную.",
  },
  opensInNewTab: "(откроется в новой вкладке)",
  paywall: {
    unlockedUntil: date => `Оповещения доступны до ${date}`,
    titleNew: "Открыть доступ к оповещениям о health factor",
    titleExtend: "Продлить доступ, чтобы изменять оповещения",
    descriptionNew:
      "Оплатите один раз, чтобы открыть настройки оповещений и задать порог health factor для каждой сети. Ничего не продлевается автоматически: вы платите из своего кошелька, когда хотите продлить доступ.",
    descriptionExtend:
      "Ваши прежние настройки оповещений сохранены. Оплатите ещё раз, чтобы продлить доступ и изменить их.",
    networkDescriptionNew: chainName =>
      `Оплатите один раз, чтобы настроить оповещения о health factor ${ruOnMarket(chainName)} и на других рынках. Ничего не продлевается автоматически: вы платите из своего кошелька, когда хотите продлить доступ.`,
    networkDescriptionExtend: chainName =>
      `Ваши сохранённые настройки оповещений ${ruForMarket(chainName)} по-прежнему в вашем аккаунте. Оплатите ещё раз, чтобы продлить доступ и изменить их.`,
    connectWallet: "Подключите кошелёк, чтобы оплатить доступ.",
    unconfigured: "Платёжный контракт для этой сети не настроен.",
    noPlan: "Сейчас нет доступного платного тарифа.",
    paused: "Платежи сейчас приостановлены. Попробуйте позже.",
    statusUnavailable: "Не удалось загрузить статус платежа. Перезагрузите страницу, чтобы попробовать ещё раз.",
    wrongNetworkTitle: "Не та сеть",
    wrongNetworkBody: (walletChain, target) =>
      `Ваш кошелёк ${walletChain ? ruOnMarket(walletChain, "network") : "в другой сети"}. Для оплаты переключитесь ${target ? `на сеть ${target}` : "на платёжную сеть"}.`,
    switchTo: target => `Переключиться ${target ? `на сеть ${target}` : "на платёжную сеть"}`,
    switching: "Переключаем сеть",
    loadingDetails: "Загружаем данные платежа",
    price: "Цена",
    access: "Доступ",
    network: "Сеть",
    networkFee: "Комиссия сети",
    networkFeeValue: symbol => `Оплачивается в ${symbol} за каждый шаг, сумма видна в кошельке`,
    period: (count, about) => (about ? aboutDays(count) : days(count)),
    pay: amount => `Оплатить ${amount}`,
    extend: (count, amount) => `Добавить ${days(count)} за ${amount}`,
    extendHint: count =>
      `Каждый платёж добавляет ${days(count)} к текущей дате окончания. Платить можно сколько угодно раз; само ничего не продлевается.`,
    accessExtended: date => `Доступ продлён до ${date}.`,
    accessActive: "Доступ открыт. Теперь можно настроить оповещения.",
    paymentPending: "Платёж подтверждён. Доступ скоро появится.",
    loading: {
      processing: "Обрабатываем",
      waitingForWallet: "Ждём ваш кошелёк",
      approving: "Одобряем",
      paying: "Оплачиваем",
    },
    unavailable: "Платный доступ сейчас недоступен.",
    checkFailed: "Не удалось проверить статус платежа. Попробуйте ещё раз чуть позже.",
    approvalNotVisible: "Одобрение подтверждено, но пока не видно. Попробуйте ещё раз чуть позже.",
  },
  payment: {
    stepsLabel: "Шаги оплаты",
    approveTitle: amount => `Одобрить ${amount}`,
    approveHint:
      "Позволяет платёжному контракту списать ровно эту сумму. Пропускается, если её покрывает более раннее одобрение.",
    payTitle: amount => `Оплатить ${amount}`,
    payHint: "Отправляет платёж и открывает доступ к оповещениям.",
    inProgress: "Выполняется",
    done: "Готово",
    notNeeded: "Не требуется",
    transaction: "Транзакция ",
    viewOn: explorer => `Открыть на сайте ${explorer}`,
    preparingTitle: "Готовим платёж",
    preparingBody: "Проверяем текущую цену и ваше одобрение.",
    confirmTitle: "Подтвердите в кошельке",
    approveSignBody: amount => `Шаг 1 из 2: одобрите ${amount}. Ничего не отправляется, пока вы не подтвердите.`,
    processingOn: network => (network ? `Обработка ${ruOnMarket(network, "network")}` : "Обработка в сети"),
    approvePendingBody: "Шаг 1 из 2: одобрение отправлено. Затем кошелёк попросит вас подтвердить платёж.",
    paySignBody: amount => `Шаг 2 из 2: оплатите ${amount}. Ничего не отправляется, пока вы не подтвердите.`,
    payPendingBody: "Шаг 2 из 2: платёж отправлен. Оповещения откроются, когда сеть его подтвердит.",
  },
};
