"use client";

import type { ReactNode } from "react";
import { ClientRoot } from "~~/components/ClientRoot";
import { MESSAGES as alerts } from "~~/i18n/messages/alerts/ru";
import { MESSAGES as blog } from "~~/i18n/messages/blog/ru";
import { MESSAGES as calculator } from "~~/i18n/messages/calculator/ru";
import { MESSAGES as common } from "~~/i18n/messages/common/ru";
import { MESSAGES as dashboard } from "~~/i18n/messages/dashboard/ru";
import { MESSAGES as morpho } from "~~/i18n/messages/morpho/ru";

const MESSAGES = { alerts, blog, calculator, common, dashboard, morpho };

/** The ru client root: the only module that brings ru strings into the browser. */
export const LocaleRoot = ({ children }: { children: ReactNode }) => (
  <ClientRoot locale="ru" messages={MESSAGES}>
    {children}
  </ClientRoot>
);
