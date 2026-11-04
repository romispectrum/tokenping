"use client";

import type { ReactNode } from "react";
import { ClientRoot } from "~~/components/ClientRoot";
import { MESSAGES as alerts } from "~~/i18n/messages/alerts/sr";
import { MESSAGES as blog } from "~~/i18n/messages/blog/sr";
import { MESSAGES as calculator } from "~~/i18n/messages/calculator/sr";
import { MESSAGES as common } from "~~/i18n/messages/common/sr";
import { MESSAGES as dashboard } from "~~/i18n/messages/dashboard/sr";
import { MESSAGES as morpho } from "~~/i18n/messages/morpho/sr";

const MESSAGES = { alerts, blog, calculator, common, dashboard, morpho };

/** The sr client root: the only module that brings sr strings into the browser. */
export const LocaleRoot = ({ children }: { children: ReactNode }) => (
  <ClientRoot locale="sr" messages={MESSAGES}>
    {children}
  </ClientRoot>
);
