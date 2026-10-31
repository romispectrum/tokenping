"use client";

import type { ReactNode } from "react";
import { ClientRoot } from "~~/components/ClientRoot";
import { MESSAGES as alerts } from "~~/i18n/messages/alerts/de";
import { MESSAGES as blog } from "~~/i18n/messages/blog/de";
import { MESSAGES as calculator } from "~~/i18n/messages/calculator/de";
import { MESSAGES as common } from "~~/i18n/messages/common/de";
import { MESSAGES as dashboard } from "~~/i18n/messages/dashboard/de";
import { MESSAGES as morpho } from "~~/i18n/messages/morpho/de";

const MESSAGES = { alerts, blog, calculator, common, dashboard, morpho };

/** The de root layout's client root: the only module that brings de strings into the browser. */
export const LocaleRoot = ({ children }: { children: ReactNode }) => (
  <ClientRoot locale="de" messages={MESSAGES}>
    {children}
  </ClientRoot>
);
