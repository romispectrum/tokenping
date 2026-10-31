"use client";

import type { ReactNode } from "react";
import { ClientRoot } from "~~/components/ClientRoot";
import { MESSAGES as alerts } from "~~/i18n/messages/alerts/cs";
import { MESSAGES as blog } from "~~/i18n/messages/blog/cs";
import { MESSAGES as calculator } from "~~/i18n/messages/calculator/cs";
import { MESSAGES as common } from "~~/i18n/messages/common/cs";
import { MESSAGES as dashboard } from "~~/i18n/messages/dashboard/cs";
import { MESSAGES as morpho } from "~~/i18n/messages/morpho/cs";

const MESSAGES = { alerts, blog, calculator, common, dashboard, morpho };

/** The cs root layout's client root: the only module that brings cs strings into the browser. */
export const LocaleRoot = ({ children }: { children: ReactNode }) => (
  <ClientRoot locale="cs" messages={MESSAGES}>
    {children}
  </ClientRoot>
);
