"use client";

import type { ReactNode } from "react";
import { ClientRoot } from "~~/components/ClientRoot";
import { MESSAGES as alerts } from "~~/i18n/messages/alerts/es";
import { MESSAGES as blog } from "~~/i18n/messages/blog/es";
import { MESSAGES as calculator } from "~~/i18n/messages/calculator/es";
import { MESSAGES as common } from "~~/i18n/messages/common/es";
import { MESSAGES as dashboard } from "~~/i18n/messages/dashboard/es";
import { MESSAGES as morpho } from "~~/i18n/messages/morpho/es";

const MESSAGES = { alerts, blog, calculator, common, dashboard, morpho };

/** The es client root: the only module that brings es strings into the browser. */
export const LocaleRoot = ({ children }: { children: ReactNode }) => (
  <ClientRoot locale="es" messages={MESSAGES}>
    {children}
  </ClientRoot>
);
