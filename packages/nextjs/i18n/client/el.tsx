"use client";

import type { ReactNode } from "react";
import { ClientRoot } from "~~/components/ClientRoot";
import { MESSAGES as alerts } from "~~/i18n/messages/alerts/el";
import { MESSAGES as blog } from "~~/i18n/messages/blog/el";
import { MESSAGES as calculator } from "~~/i18n/messages/calculator/el";
import { MESSAGES as common } from "~~/i18n/messages/common/el";
import { MESSAGES as dashboard } from "~~/i18n/messages/dashboard/el";
import { MESSAGES as morpho } from "~~/i18n/messages/morpho/el";

const MESSAGES = { alerts, blog, calculator, common, dashboard, morpho };

/** The el root layout's client root: the only module that brings el strings into the browser. */
export const LocaleRoot = ({ children }: { children: ReactNode }) => (
  <ClientRoot locale="el" messages={MESSAGES}>
    {children}
  </ClientRoot>
);
