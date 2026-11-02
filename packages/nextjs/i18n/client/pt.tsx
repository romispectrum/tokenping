"use client";

import type { ReactNode } from "react";
import { ClientRoot } from "~~/components/ClientRoot";
import { MESSAGES as alerts } from "~~/i18n/messages/alerts/pt";
import { MESSAGES as blog } from "~~/i18n/messages/blog/pt";
import { MESSAGES as calculator } from "~~/i18n/messages/calculator/pt";
import { MESSAGES as common } from "~~/i18n/messages/common/pt";
import { MESSAGES as dashboard } from "~~/i18n/messages/dashboard/pt";
import { MESSAGES as morpho } from "~~/i18n/messages/morpho/pt";

const MESSAGES = { alerts, blog, calculator, common, dashboard, morpho };

/** The pt root layout's client root: the only module that brings pt strings into the browser. */
export const LocaleRoot = ({ children }: { children: ReactNode }) => (
  <ClientRoot locale="pt" messages={MESSAGES}>
    {children}
  </ClientRoot>
);
