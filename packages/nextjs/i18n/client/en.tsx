"use client";

import type { ReactNode } from "react";
import { ClientRoot } from "~~/components/ClientRoot";
import { MESSAGES as alerts } from "~~/i18n/messages/alerts/en";
import { MESSAGES as blog } from "~~/i18n/messages/blog/en";
import { MESSAGES as calculator } from "~~/i18n/messages/calculator/en";
import { MESSAGES as common } from "~~/i18n/messages/common/en";
import { MESSAGES as dashboard } from "~~/i18n/messages/dashboard/en";
import { MESSAGES as morpho } from "~~/i18n/messages/morpho/en";

const MESSAGES = { alerts, blog, calculator, common, dashboard, morpho };

/** The en client root: the only module that brings en strings into the browser. */
export const LocaleRoot = ({ children }: { children: ReactNode }) => (
  <ClientRoot locale="en" messages={MESSAGES}>
    {children}
  </ClientRoot>
);
