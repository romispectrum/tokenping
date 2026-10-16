import type { ReactNode } from "react";
import { BellRing, CircleCheck } from "lucide-react";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "~~/components/ui";
import { useMessages } from "~~/i18n/LocaleProvider";
import { ALERTS_MESSAGES } from "~~/i18n/messages/alerts";

type NotificationCardProps = {
  isActive: boolean;
  /** Rendered at the right end of the header row. */
  headerRight?: ReactNode;
  children: ReactNode;
};

/** The flat product card every state of the notification settings sits in. Its h3 is part of the dashboard outline. */
export const NotificationCard = ({ isActive, headerRight, children }: NotificationCardProps) => {
  const t = useMessages(ALERTS_MESSAGES);
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <BellRing aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" strokeWidth={1.5} />
            <CardTitle>{t.cardTitle}</CardTitle>
            {isActive ? (
              <Badge variant="success">
                <CircleCheck aria-hidden="true" />
                {t.active}
              </Badge>
            ) : null}
          </div>
          {/* ml-auto keeps the control at the right edge when the row wraps on a narrow card. */}
          {headerRight ? <div className="ml-auto">{headerRight}</div> : null}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
};
