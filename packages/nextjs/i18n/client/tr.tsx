"use client";

import type { ReactNode } from "react";
import { ClientRoot } from "~~/components/ClientRoot";
import { MESSAGES as alerts } from "~~/i18n/messages/alerts/tr";
import { MESSAGES as blog } from "~~/i18n/messages/blog/tr";
import { MESSAGES as calculator } from "~~/i18n/messages/calculator/tr";
import { MESSAGES as common } from "~~/i18n/messages/common/tr";
import { MESSAGES as dashboard } from "~~/i18n/messages/dashboard/tr";
import { MESSAGES as morpho } from "~~/i18n/messages/morpho/tr";

const MESSAGES = { alerts, blog, calculator, common, dashboard, morpho };

/** The tr root layout's client root: the only module that brings tr strings into the browser. */
export const LocaleRoot = ({ children }: { children: ReactNode }) => (
  <ClientRoot locale="tr" messages={MESSAGES}>
    {children}
  </ClientRoot>
);
