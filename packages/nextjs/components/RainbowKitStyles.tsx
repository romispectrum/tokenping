"use client";

import "@rainbow-me/rainbowkit/styles.css";

/**
 * Renders nothing: importing this module loads RainbowKit's stylesheet. Every rule in it is scoped to RainbowKit's own
 * classes under [data-rk], so it only styles the wallet modals and stays out of the CSS that every page inlines.
 * ScaffoldEthAppWithProviders loads it in the browser after hydration.
 */
export const RainbowKitStyles = () => null;
