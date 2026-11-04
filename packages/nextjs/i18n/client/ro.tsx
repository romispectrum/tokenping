"use client";

import type { ReactNode } from "react";
import { ClientRoot } from "~~/components/ClientRoot";
import { MESSAGES as alerts } from "~~/i18n/messages/alerts/ro";
import { MESSAGES as blog } from "~~/i18n/messages/blog/ro";
import { MESSAGES as calculator } from "~~/i18n/messages/calculator/ro";
import { MESSAGES as common } from "~~/i18n/messages/common/ro";
import { MESSAGES as dashboard } from "~~/i18n/messages/dashboard/ro";
import { MESSAGES as morpho } from "~~/i18n/messages/morpho/ro";

const MESSAGES = { alerts, blog, calculator, common, dashboard, morpho };

/** The ro client root: the only module that brings ro strings into the browser. */
export const LocaleRoot = ({ children }: { children: ReactNode }) => (
  <ClientRoot locale="ro" messages={MESSAGES}>
    {children}
  </ClientRoot>
);
