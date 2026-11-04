"use client";

import type { ReactNode } from "react";
import { ClientRoot } from "~~/components/ClientRoot";
import { MESSAGES as alerts } from "~~/i18n/messages/alerts/bg";
import { MESSAGES as blog } from "~~/i18n/messages/blog/bg";
import { MESSAGES as calculator } from "~~/i18n/messages/calculator/bg";
import { MESSAGES as common } from "~~/i18n/messages/common/bg";
import { MESSAGES as dashboard } from "~~/i18n/messages/dashboard/bg";
import { MESSAGES as morpho } from "~~/i18n/messages/morpho/bg";

const MESSAGES = { alerts, blog, calculator, common, dashboard, morpho };

/** The bg root layout's client root: the only module that brings bg strings into the browser. */
export const LocaleRoot = ({ children }: { children: ReactNode }) => (
  <ClientRoot locale="bg" messages={MESSAGES}>
    {children}
  </ClientRoot>
);
