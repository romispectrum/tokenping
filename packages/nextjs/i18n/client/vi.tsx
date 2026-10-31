"use client";

import type { ReactNode } from "react";
import { ClientRoot } from "~~/components/ClientRoot";
import { MESSAGES as alerts } from "~~/i18n/messages/alerts/vi";
import { MESSAGES as blog } from "~~/i18n/messages/blog/vi";
import { MESSAGES as calculator } from "~~/i18n/messages/calculator/vi";
import { MESSAGES as common } from "~~/i18n/messages/common/vi";
import { MESSAGES as dashboard } from "~~/i18n/messages/dashboard/vi";
import { MESSAGES as morpho } from "~~/i18n/messages/morpho/vi";

const MESSAGES = { alerts, blog, calculator, common, dashboard, morpho };

/** The vi root layout's client root: the only module that brings vi strings into the browser. */
export const LocaleRoot = ({ children }: { children: ReactNode }) => (
  <ClientRoot locale="vi" messages={MESSAGES}>
    {children}
  </ClientRoot>
);
