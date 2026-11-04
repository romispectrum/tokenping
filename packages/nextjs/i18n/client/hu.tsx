"use client";

import type { ReactNode } from "react";
import { ClientRoot } from "~~/components/ClientRoot";
import { MESSAGES as alerts } from "~~/i18n/messages/alerts/hu";
import { MESSAGES as blog } from "~~/i18n/messages/blog/hu";
import { MESSAGES as calculator } from "~~/i18n/messages/calculator/hu";
import { MESSAGES as common } from "~~/i18n/messages/common/hu";
import { MESSAGES as dashboard } from "~~/i18n/messages/dashboard/hu";
import { MESSAGES as morpho } from "~~/i18n/messages/morpho/hu";

const MESSAGES = { alerts, blog, calculator, common, dashboard, morpho };

/** The hu root layout's client root: the only module that brings hu strings into the browser. */
export const LocaleRoot = ({ children }: { children: ReactNode }) => (
  <ClientRoot locale="hu" messages={MESSAGES}>
    {children}
  </ClientRoot>
);
