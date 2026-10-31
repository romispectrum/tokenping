import type { AlertsMessages } from "~~/i18n/messages/alerts";
import type { BlogMessages } from "~~/i18n/messages/blog";
import type { CalculatorMessages } from "~~/i18n/messages/calculator";
import type { CommonMessages } from "~~/i18n/messages/common";
import type { DashboardMessages } from "~~/i18n/messages/dashboard";
import type { MorphoMessages } from "~~/i18n/messages/morpho";

/** The message areas client components read, one language's worth (see i18n/client/<locale>.tsx). */
export type ClientMessages = {
  alerts: AlertsMessages;
  blog: BlogMessages;
  calculator: CalculatorMessages;
  common: CommonMessages;
  dashboard: DashboardMessages;
  morpho: MorphoMessages;
};
