"use client";

import type { ReactNode } from "react";
import { ClientRoot } from "~~/components/ClientRoot";
import { MESSAGES as alerts } from "~~/i18n/messages/alerts/hr";
import { MESSAGES as blog } from "~~/i18n/messages/blog/hr";
import { MESSAGES as calculator } from "~~/i18n/messages/calculator/hr";
import { MESSAGES as common } from "~~/i18n/messages/common/hr";
import { MESSAGES as dashboard } from "~~/i18n/messages/dashboard/hr";
import { MESSAGES as morpho } from "~~/i18n/messages/morpho/hr";

const MESSAGES = { alerts, blog, calculator, common, dashboard, morpho };

/** The hr client root: the only module that brings hr strings into the browser. */
export const LocaleRoot = ({ children }: { children: ReactNode }) => (
  <ClientRoot locale="hr" messages={MESSAGES}>
    {children}
  </ClientRoot>
);
