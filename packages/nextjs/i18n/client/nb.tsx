"use client";

import type { ReactNode } from "react";
import { ClientRoot } from "~~/components/ClientRoot";
import { MESSAGES as alerts } from "~~/i18n/messages/alerts/nb";
import { MESSAGES as blog } from "~~/i18n/messages/blog/nb";
import { MESSAGES as calculator } from "~~/i18n/messages/calculator/nb";
import { MESSAGES as common } from "~~/i18n/messages/common/nb";
import { MESSAGES as dashboard } from "~~/i18n/messages/dashboard/nb";
import { MESSAGES as morpho } from "~~/i18n/messages/morpho/nb";

const MESSAGES = { alerts, blog, calculator, common, dashboard, morpho };

/** The nb client root: the only module that brings nb strings into the browser. */
export const LocaleRoot = ({ children }: { children: ReactNode }) => (
  <ClientRoot locale="nb" messages={MESSAGES}>
    {children}
  </ClientRoot>
);
