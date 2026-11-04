"use client";

import type { ReactNode } from "react";
import { ClientRoot } from "~~/components/ClientRoot";
import { MESSAGES as alerts } from "~~/i18n/messages/alerts/fil";
import { MESSAGES as blog } from "~~/i18n/messages/blog/fil";
import { MESSAGES as calculator } from "~~/i18n/messages/calculator/fil";
import { MESSAGES as common } from "~~/i18n/messages/common/fil";
import { MESSAGES as dashboard } from "~~/i18n/messages/dashboard/fil";
import { MESSAGES as morpho } from "~~/i18n/messages/morpho/fil";

const MESSAGES = { alerts, blog, calculator, common, dashboard, morpho };

/** The fil root layout's client root: the only module that brings fil strings into the browser. */
export const LocaleRoot = ({ children }: { children: ReactNode }) => (
  <ClientRoot locale="fil" messages={MESSAGES}>
    {children}
  </ClientRoot>
);
