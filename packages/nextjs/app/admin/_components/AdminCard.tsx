import type { ReactNode } from "react";

type AdminCardProps = {
  title: string;
  description: ReactNode;
  className?: string;
  children: ReactNode;
};

export const AdminCard = ({ title, description, className, children }: AdminCardProps) => (
  <div
    className={`card bg-base-100 border border-base-300 dark:border-white/10 shadow-sm${className ? ` ${className}` : ""}`}
  >
    <div className="card-body">
      <h2 className="card-title">{title}</h2>
      <p className="text-sm text-base-content/70">{description}</p>
      {children}
    </div>
  </div>
);
