"use client";

import type { ReactNode } from "react";
import { ClientRoot } from "~~/components/ClientRoot";
import { MESSAGES as alerts } from "~~/i18n/messages/alerts/sl";
import { MESSAGES as blog } from "~~/i18n/messages/blog/sl";
import { MESSAGES as calculator } from "~~/i18n/messages/calculator/sl";
import { MESSAGES as common } from "~~/i18n/messages/common/sl";
import { MESSAGES as dashboard } from "~~/i18n/messages/dashboard/sl";
import { MESSAGES as morpho } from "~~/i18n/messages/morpho/sl";

const MESSAGES = { alerts, blog, calculator, common, dashboard, morpho };

/** The sl client root: the only module that brings sl strings into the browser. */
export const LocaleRoot = ({ children }: { children: ReactNode }) => (
  <ClientRoot locale="sl" messages={MESSAGES}>
    {children}
  </ClientRoot>
);
