import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: ReactNode;
};

/** The title row of a product page: its one h1 in text-2xl Medium and a one-sentence description. */
export const PageHeader = ({ title, description }: PageHeaderProps) => (
  <div className="flex flex-col gap-1">
    <h1 className="m-0 text-2xl font-medium tracking-tight text-foreground">{title}</h1>
    {description ? <p className="m-0 max-w-prose text-sm text-muted-foreground">{description}</p> : null}
  </div>
);
