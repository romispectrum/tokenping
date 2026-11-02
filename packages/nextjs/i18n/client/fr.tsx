"use client";

import type { ReactNode } from "react";
import { ClientRoot } from "~~/components/ClientRoot";
import { MESSAGES as alerts } from "~~/i18n/messages/alerts/fr";
import { MESSAGES as blog } from "~~/i18n/messages/blog/fr";
import { MESSAGES as calculator } from "~~/i18n/messages/calculator/fr";
import { MESSAGES as common } from "~~/i18n/messages/common/fr";
import { MESSAGES as dashboard } from "~~/i18n/messages/dashboard/fr";
import { MESSAGES as morpho } from "~~/i18n/messages/morpho/fr";

const MESSAGES = { alerts, blog, calculator, common, dashboard, morpho };

/** The fr root layout's client root: the only module that brings fr strings into the browser. */
export const LocaleRoot = ({ children }: { children: ReactNode }) => (
  <ClientRoot locale="fr" messages={MESSAGES}>
    {children}
  </ClientRoot>
);
