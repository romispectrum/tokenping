"use client";

import type { ReactNode } from "react";
import { ClientRoot } from "~~/components/ClientRoot";
import { MESSAGES as alerts } from "~~/i18n/messages/alerts/nl";
import { MESSAGES as blog } from "~~/i18n/messages/blog/nl";
import { MESSAGES as calculator } from "~~/i18n/messages/calculator/nl";
import { MESSAGES as common } from "~~/i18n/messages/common/nl";
import { MESSAGES as dashboard } from "~~/i18n/messages/dashboard/nl";
import { MESSAGES as morpho } from "~~/i18n/messages/morpho/nl";

const MESSAGES = { alerts, blog, calculator, common, dashboard, morpho };

/** The nl root layout's client root: the only module that brings nl strings into the browser. */
export const LocaleRoot = ({ children }: { children: ReactNode }) => (
  <ClientRoot locale="nl" messages={MESSAGES}>
    {children}
  </ClientRoot>
);
