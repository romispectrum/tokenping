"use client";

import type { ReactNode } from "react";
import { ClientRoot } from "~~/components/ClientRoot";
import { MESSAGES as alerts } from "~~/i18n/messages/alerts/id";
import { MESSAGES as blog } from "~~/i18n/messages/blog/id";
import { MESSAGES as calculator } from "~~/i18n/messages/calculator/id";
import { MESSAGES as common } from "~~/i18n/messages/common/id";
import { MESSAGES as dashboard } from "~~/i18n/messages/dashboard/id";
import { MESSAGES as morpho } from "~~/i18n/messages/morpho/id";

const MESSAGES = { alerts, blog, calculator, common, dashboard, morpho };

/** The id root layout's client root: the only module that brings id strings into the browser. */
export const LocaleRoot = ({ children }: { children: ReactNode }) => (
  <ClientRoot locale="id" messages={MESSAGES}>
    {children}
  </ClientRoot>
);
