import type { ReactNode } from "react";

type InfoTileProps = {
  label: string;
  children: ReactNode;
};

export const InfoTile = ({ label, children }: InfoTileProps) => (
  <div className="rounded-xl bg-base-200 dark:bg-base-300/10 p-3">
    <div className="font-semibold mb-1">{label}</div>
    {children}
  </div>
);
