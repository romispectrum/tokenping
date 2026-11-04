"use client";

import type { ReactNode } from "react";
import { ClientRoot } from "~~/components/ClientRoot";
import { MESSAGES as alerts } from "~~/i18n/messages/alerts/da";
import { MESSAGES as blog } from "~~/i18n/messages/blog/da";
import { MESSAGES as calculator } from "~~/i18n/messages/calculator/da";
import { MESSAGES as common } from "~~/i18n/messages/common/da";
import { MESSAGES as dashboard } from "~~/i18n/messages/dashboard/da";
import { MESSAGES as morpho } from "~~/i18n/messages/morpho/da";

const MESSAGES = { alerts, blog, calculator, common, dashboard, morpho };

/** The da root layout's client root: the only module that brings da strings into the browser. */
export const LocaleRoot = ({ children }: { children: ReactNode }) => (
  <ClientRoot locale="da" messages={MESSAGES}>
    {children}
  </ClientRoot>
);
