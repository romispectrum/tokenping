"use client";

import type { ReactNode } from "react";
import { ClientRoot } from "~~/components/ClientRoot";
import { MESSAGES as alerts } from "~~/i18n/messages/alerts/pl";
import { MESSAGES as blog } from "~~/i18n/messages/blog/pl";
import { MESSAGES as calculator } from "~~/i18n/messages/calculator/pl";
import { MESSAGES as common } from "~~/i18n/messages/common/pl";
import { MESSAGES as dashboard } from "~~/i18n/messages/dashboard/pl";
import { MESSAGES as morpho } from "~~/i18n/messages/morpho/pl";

const MESSAGES = { alerts, blog, calculator, common, dashboard, morpho };

/** The pl root layout's client root: the only module that brings pl strings into the browser. */
export const LocaleRoot = ({ children }: { children: ReactNode }) => (
  <ClientRoot locale="pl" messages={MESSAGES}>
    {children}
  </ClientRoot>
);
