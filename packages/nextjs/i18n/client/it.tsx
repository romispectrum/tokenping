"use client";

import type { ReactNode } from "react";
import { ClientRoot } from "~~/components/ClientRoot";
import { MESSAGES as alerts } from "~~/i18n/messages/alerts/it";
import { MESSAGES as blog } from "~~/i18n/messages/blog/it";
import { MESSAGES as calculator } from "~~/i18n/messages/calculator/it";
import { MESSAGES as common } from "~~/i18n/messages/common/it";
import { MESSAGES as dashboard } from "~~/i18n/messages/dashboard/it";
import { MESSAGES as morpho } from "~~/i18n/messages/morpho/it";

const MESSAGES = { alerts, blog, calculator, common, dashboard, morpho };

/** The it root layout's client root: the only module that brings it strings into the browser. */
export const LocaleRoot = ({ children }: { children: ReactNode }) => (
  <ClientRoot locale="it" messages={MESSAGES}>
    {children}
  </ClientRoot>
);
