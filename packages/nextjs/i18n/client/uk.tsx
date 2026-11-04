"use client";

import type { ReactNode } from "react";
import { ClientRoot } from "~~/components/ClientRoot";
import { MESSAGES as alerts } from "~~/i18n/messages/alerts/uk";
import { MESSAGES as blog } from "~~/i18n/messages/blog/uk";
import { MESSAGES as calculator } from "~~/i18n/messages/calculator/uk";
import { MESSAGES as common } from "~~/i18n/messages/common/uk";
import { MESSAGES as dashboard } from "~~/i18n/messages/dashboard/uk";
import { MESSAGES as morpho } from "~~/i18n/messages/morpho/uk";

const MESSAGES = { alerts, blog, calculator, common, dashboard, morpho };

/** The uk client root: the only module that brings uk strings into the browser. */
export const LocaleRoot = ({ children }: { children: ReactNode }) => (
  <ClientRoot locale="uk" messages={MESSAGES}>
    {children}
  </ClientRoot>
);
