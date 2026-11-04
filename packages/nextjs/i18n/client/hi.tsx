"use client";

import type { ReactNode } from "react";
import { ClientRoot } from "~~/components/ClientRoot";
import { MESSAGES as alerts } from "~~/i18n/messages/alerts/hi";
import { MESSAGES as blog } from "~~/i18n/messages/blog/hi";
import { MESSAGES as calculator } from "~~/i18n/messages/calculator/hi";
import { MESSAGES as common } from "~~/i18n/messages/common/hi";
import { MESSAGES as dashboard } from "~~/i18n/messages/dashboard/hi";
import { MESSAGES as morpho } from "~~/i18n/messages/morpho/hi";

const MESSAGES = { alerts, blog, calculator, common, dashboard, morpho };

/** The hi client root: the only module that brings hi strings into the browser. */
export const LocaleRoot = ({ children }: { children: ReactNode }) => (
  <ClientRoot locale="hi" messages={MESSAGES}>
    {children}
  </ClientRoot>
);
