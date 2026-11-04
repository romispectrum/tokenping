"use client";

import type { ReactNode } from "react";
import { ClientRoot } from "~~/components/ClientRoot";
import { MESSAGES as alerts } from "~~/i18n/messages/alerts/sv";
import { MESSAGES as blog } from "~~/i18n/messages/blog/sv";
import { MESSAGES as calculator } from "~~/i18n/messages/calculator/sv";
import { MESSAGES as common } from "~~/i18n/messages/common/sv";
import { MESSAGES as dashboard } from "~~/i18n/messages/dashboard/sv";
import { MESSAGES as morpho } from "~~/i18n/messages/morpho/sv";

const MESSAGES = { alerts, blog, calculator, common, dashboard, morpho };

/** The sv client root: the only module that brings sv strings into the browser. */
export const LocaleRoot = ({ children }: { children: ReactNode }) => (
  <ClientRoot locale="sv" messages={MESSAGES}>
    {children}
  </ClientRoot>
);
