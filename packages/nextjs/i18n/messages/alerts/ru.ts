import type { AlertsMessages } from "./shared";
import { plural, ruForMarket, ruOnMarket } from "~~/i18n/format";

const ATTRIBUTION_QUESTION = "Как вы узнали о Tokenping?";

const everyMinutes = (minutes: number) =>
  plural("ru", minutes, {
    one: `раз в ${minutes} минуту`,
    few: `раз в ${minutes} минуты`,
    many: `раз в ${minutes} минут`,
    other: `раз в ${minutes} минуты`,
  });

// The channel's name from serviceNames ("Email", "Signal", "Telegram"): email reads "по email", the others "через Signal".
const via = (channel: string) => (channel === "Email" ? "по email" : `через ${channel}`);

export const MESSAGES: AlertsMessages = {
  cardTitle: "Настройки оповещений",
  active: "Активно",
  payToEdit: "Оплатить доступ, чтобы изменить",
  editAlert: "Изменить оповещение",
  signInTitle: "Войдите, чтобы управлять оповещениями",
  signInDescription:
    "Кошелёк подписывает сообщение, которое подтверждает, что адрес принадлежит вам. Это не транзакция, и газ за неё не списывается.",
  signIn: "Войти через кошелёк",
  signingIn: "Ждём ваш кошелёк",
  signInStatement: "Войдите в Tokenping, чтобы видеть и изменять свои оповещения о health factor.",
  signInRejected: "Вы отклонили запрос на подпись. Войдите, чтобы видеть и изменять свои оповещения.",
  signInFailed: "Не удалось войти. Попробуйте ещё раз.",
  signInExpired: "Сеанс входа завершился. Войдите через кошелёк ещё раз.",
  emptyTitle: (chainName, kind) => `Оповещений ${ruOnMarket(chainName, kind)} пока нет`,
  emptyDescription: "Получайте сообщение, когда ваш health factor опускается ниже выбранного вами порога.",
  createAlert: "Создать оповещение",
  loadErrorTitle: "Не удалось загрузить настройки оповещений",
  loadErrorDescription: "Проверьте подключение и попробуйте ещё раз.",
  tryAgain: "Попробовать ещё раз",
  retrying: "Пробуем ещё раз",
  servicesLegend: "Каналы оповещений",
  servicesDescription: "Выберите, куда отправлять оповещения. Можно выбрать несколько каналов.",
  serviceNames: { email: "Email", signal: "Signal", telegram: "Telegram" },
  emailLabel: "Адрес email",
  emailDescription: "Оповещения приходят на этот адрес.",
  emailPlaceholder: "you@example.com",
  signalLabel: "Имя пользователя в Signal",
  signalDescription: "В Signal откройте «Настройки», затем «Профиль». Имя выглядит так: alice.42.",
  telegramLabel: "Имя пользователя в Telegram",
  telegramDescription:
    "Оповещения приходят в этот аккаунт Telegram. Имя можно найти в Telegram: «Настройки», затем «Имя пользователя».",
  telegramPlaceholder: "alice_eth",
  telegramChecking: "Проверяем",
  telegramLinked: username => `@${username} подключён: оповещения будут приходить в ваш чат в Telegram.`,
  telegramPressStart: bot => `Ещё не подключено: один раз нажмите Start в ${bot ? `@${bot}` : "боте Tokenping"}.`,
  openBot: bot => `Открыть @${bot}`,
  telegramStatusUnknown: "Не удалось проверить, подключено ли это имя пользователя. Сохранить всё равно можно.",
  opensInNewTab: "(откроется в новой вкладке)",
  channelLanguageLabels: { email: "Язык email", signal: "Язык в Signal", telegram: "Язык в Telegram" },
  thresholdLabel: "Порог health factor",
  thresholdExactValue: "(точное значение)",
  thresholdScale: { critical: "Критический", safe: "Безопасный", verySafe: "Очень безопасный" },
  thresholdDescription: (threshold, chainName, kind) =>
    `Вы получите оповещение, когда ваш health factor ${ruOnMarket(chainName, kind)} опустится ниже ${threshold}.`,
  saveAlert: "Сохранить оповещение",
  saving: "Сохраняем",
  cancel: "Отмена",
  deleteAlert: "Удалить оповещение",
  deleting: "Удаляем",
  keepAlert: "Оставить оповещение",
  deleteTitle: "Удалить это оповещение?",
  deleteDescription: (chainName, kind) =>
    `Tokenping перестанет отправлять оповещения о health factor ${ruForMarket(chainName, kind)}.`,
  errorSummaryTitle: count =>
    plural("ru", count, {
      one: `Исправьте ${count} поле, чтобы сохранить`,
      few: `Исправьте ${count} поля, чтобы сохранить`,
      many: `Исправьте ${count} полей, чтобы сохранить`,
      other: `Исправьте ${count} поля, чтобы сохранить`,
    }),
  formErrors: {
    noService: "Выберите хотя бы один канал оповещений.",
    noEmail: "Введите свой адрес email.",
    invalidEmail: "Введите адрес email в формате name@example.com.",
    noSignal: "Введите своё имя пользователя в Signal.",
    invalidSignal:
      "Введите имя пользователя Signal в формате alice.42. Его можно найти в Signal: «Настройки», затем «Профиль».",
    noTelegram: "Введите своё имя пользователя в Telegram.",
    invalidTelegram:
      "Введите имя пользователя Telegram в формате alice_eth: от 4 до 32 латинских букв, цифр или подчёркиваний, начинается с буквы и не заканчивается на _.",
  },
  summaryServices: "Каналы",
  summaryNoServices: "Ничего не выбрано",
  summaryEmail: "Email",
  summarySignal: "Signal",
  summaryTelegram: "Telegram",
  summaryLanguage: "Язык",
  summaryTelegramNotLinked: bot => `Ещё не подключено: один раз нажмите Start в @${bot}.`,
  summaryThreshold: "Порог",
  sendTest: "Отправить тест",
  sendingTest: "Отправляем",
  testAgainIn: minutes => `Снова через ${minutes} мин`,
  testSent: channel => `Тестовое сообщение отправлено ${via(channel)}. Проверьте, что оно пришло.`,
  testFailed: "Тестовое сообщение не отправлено",
  testLimitNote: minutes =>
    `Тест отправляет это оповещение и вашу позицию в текущем состоянии. Один тест на канал ${everyMinutes(minutes)}.`,
  belowThresholdTitle: "Ниже порога вашего оповещения",
  belowThresholdDescription: (healthFactor, threshold) =>
    `Ваш текущий health factor (${healthFactor}) ниже вашего порога ${threshold}.`,
  alertSaved: "Оповещение сохранено",
  saveFailed: "Не удалось сохранить оповещение",
  alertDeleted: "Оповещение удалено",
  deleteFailed: "Не удалось удалить оповещение",
  attributionQuestion: ATTRIBUTION_QUESTION,
  attributionFormLabel: `${ATTRIBUTION_QUESTION} (необязательно)`,
  attributionDescription:
    "Ответ помогает нам понять, какие каналы работают. Он сохраняется вместе с адресом вашего кошелька.",
  attributionEmpty: "Введите ответ или нажмите «Пропустить».",
  // The checks behind it (length, hidden control characters) only fail for pasted text.
  attributionInvalid: () =>
    "Ответ слишком длинный или содержит скрытые символы. Наберите его заново и попробуйте ещё раз.",
  attributionSendFailed: "Не удалось отправить ответ. Попробуйте ещё раз или пропустите вопрос.",
  sendAnswer: "Отправить ответ",
  sending: "Отправляем",
  skip: "Пропустить",
  answerSent: "Ответ отправлен",
};
