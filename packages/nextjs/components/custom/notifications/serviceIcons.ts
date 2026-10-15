import { type LucideIcon, Mail, MessageSquareLock, Send } from "lucide-react";
import type { NotificationService } from "~~/types/notifications";

/** The icon drawn next to each channel's name. */
export const SERVICE_ICONS: Record<NotificationService, LucideIcon> = {
  email: Mail,
  signal: MessageSquareLock,
  telegram: Send,
};
