import type { TelegramReplies } from "./shared";

export const MESSAGES: TelegramReplies = {
  privateChatsOnly: "Tokenping działa tylko w czatach prywatnych. Napisz bezpośrednio do bota.",
  noUsername:
    "Twoje konto Telegram nie ma jeszcze nazwy użytkownika. Ustaw ją w aplikacji Telegram (Ustawienia, potem Nazwa " +
    "użytkownika), wpisz ją w swoim alercie w Tokenping, a potem wyślij tu ponownie /start.",
  linkSaveFailed: "Coś poszło nie tak przy łączeniu tego czatu. Wyślij /start jeszcze raz.",
  linked: username =>
    `Połączono @${username}. Alerty Tokenping, które wskazują @${username}, będą trafiać do tego czatu.\n\n` +
    "Wyślij /stop w dowolnej chwili, aby je zatrzymać.",
  unsubscribed: "Zatrzymano. Alerty Tokenping nie będą już tu trafiać. Wyślij /start, aby znów je otrzymywać.",
  unsubscribeFailed: "Coś poszło nie tak przy zatrzymywaniu alertów. Wyślij /stop jeszcze raz.",
  help:
    "Tokenping pisze do ciebie, gdy twój współczynnik zdrowia w Aave lub Morpho spadnie poniżej progu ustawionego w aplikacji.\n\n" +
    "Wpisz swoją nazwę użytkownika Telegram w alercie w Tokenping, a potem wyślij tu raz /start.\n\n" +
    "Polecenia:\n" +
    "/start: połącz ten czat ze swoją nazwą użytkownika\n" +
    "/stop: zatrzymaj tutaj wszystkie alerty Tokenping\n" +
    "/help: pokaż tę wiadomość",
  unknownCommand: "Odpowiadam tylko na /start, /stop i /help. Alertami zarządzasz w aplikacji Tokenping.",
};
