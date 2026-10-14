"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { NotificationCard } from "~~/components/custom/notifications/NotificationCard";
import { NotificationEmptyState } from "~~/components/custom/notifications/NotificationEmptyState";
import { NotificationSummary } from "~~/components/custom/notifications/NotificationSummary";
import { RecipientFields } from "~~/components/custom/notifications/RecipientFields";
import { ServiceSelector } from "~~/components/custom/notifications/ServiceSelector";
import { TelegramConnectField } from "~~/components/custom/notifications/TelegramConnectField";
import { ThresholdField } from "~~/components/custom/notifications/ThresholdField";
import {
  EMPTY_FORM_STATE,
  type NotificationFormState,
  buildConfigUpdate,
  canSubmitNotificationForm,
  configToFormState,
  configToFormStateOnCancel,
  toggleService,
  validateNotificationForm,
} from "~~/components/custom/notifications/notificationForm";
import { useAccess } from "~~/hooks/custom/useAccess";
import { useNotificationConfig } from "~~/hooks/custom/useNotificationConfig";
import { useTelegramLink } from "~~/hooks/custom/useTelegramLink";
import { getErrorMessage } from "~~/utils/errors";
import { isBelowThreshold } from "~~/utils/healthFactor";
import { notification } from "~~/utils/scaffold-eth";

type NotificationConfigProps = {
  /** Aave/position chain (the network this config is for). Must match position.chainId, not wallet's connected chain. */
  chainId: number;
  chainName: string;
  currentHealthFactor: string;
};

export const NotificationConfig = ({ chainId, chainName, currentHealthFactor }: NotificationConfigProps) => {
  const { getConfig, updateConfig, deleteConfig, isLoaded } = useNotificationConfig();
  const { isActive: hasAccess } = useAccess();
  const { address } = useAccount();
  const config = getConfig(chainId);

  // This component's useNotificationConfig starts empty, so config is null on the first render; the effect hydrates.
  const [form, setForm] = useState(EMPTY_FORM_STATE);
  const telegram = useTelegramLink(address);
  const { setLink: setTelegramLink, stopPolling: stopTelegramPolling } = telegram;
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync local state from config only when not editing, so the slider/inputs aren't reset while the user is changing them.
  // Depend on getConfig + chainId (not config): getConfig() returns a new object every time, which would cause infinite re-renders.
  useEffect(() => {
    const savedConfig = getConfig(chainId);
    if (savedConfig && !isEditing) {
      setForm(configToFormState(savedConfig));
      setTelegramLink(savedConfig.telegramChatId, savedConfig.telegramUsername);
    }
  }, [getConfig, chainId, isEditing, setTelegramLink]);

  if (!isLoaded) return null;

  const hasConfig = config !== null;

  // No access and no config: the paywall above is enough.
  if (!hasAccess && !hasConfig) return null;

  const updateForm = (patch: Partial<NotificationFormState>) => setForm(prev => ({ ...prev, ...patch }));
  const submission = { ...form, telegramChatId: telegram.chatId };

  const summary = (
    <NotificationSummary
      services={form.services}
      email={form.email}
      signalRecipient={form.signalRecipient}
      telegramChatId={telegram.chatId}
      telegramUsername={telegram.username}
      threshold={form.threshold}
      currentHealthFactor={currentHealthFactor}
      showBelowThresholdWarning={form.enabled && isBelowThreshold(currentHealthFactor, form.threshold)}
    />
  );

  // Access lapsed but a config exists: read-only summary.
  if (!hasAccess) {
    return (
      <NotificationCard
        isActive={form.enabled}
        headerRight={<span className="text-[10px] text-amber-400">Pay for access to edit</span>}
      >
        {summary}
      </NotificationCard>
    );
  }

  const handleStore = async () => {
    const validationError = validateNotificationForm(submission);
    if (validationError) {
      notification.error(validationError);
      return;
    }

    setIsSaving(true);
    try {
      await updateConfig(chainId, buildConfigUpdate(form));
      notification.success("Notification configuration saved.");
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save notification config:", error);
      notification.error(getErrorMessage(error, "Failed to save configuration"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteConfig(chainId);
      setIsEditing(true);
      setForm(EMPTY_FORM_STATE);
    } catch (error) {
      // BUG(B0.10): a failed delete is only logged; the user gets no feedback.
      console.error("Failed to delete notification config:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setForm(configToFormStateOnCancel(config));
    if (config) setTelegramLink(config.telegramChatId, config.telegramUsername);
    stopTelegramPolling();
    setIsEditing(false);
  };

  if (!hasConfig && !isEditing) {
    return <NotificationEmptyState chainName={chainName} onCreate={() => setIsEditing(true)} />;
  }

  return (
    <NotificationCard
      isActive={hasConfig && form.enabled}
      headerRight={
        !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs px-2 py-1 rounded-lg border border-base-300 bg-base-200 text-base-content dark:border-white/10 dark:bg-white/5 dark:text-gray-300 hover:bg-base-300 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
          >
            Edit
          </button>
        )
      }
    >
      {isEditing ? (
        <div className="space-y-4">
          <ServiceSelector
            services={form.services}
            onToggle={service => setForm(prev => ({ ...prev, services: toggleService(prev.services, service) }))}
          />
          <RecipientFields
            services={form.services}
            email={form.email}
            signalRecipient={form.signalRecipient}
            onEmailChange={email => updateForm({ email })}
            onSignalRecipientChange={signalRecipient => updateForm({ signalRecipient })}
          />
          {form.services.includes("telegram") && (
            <TelegramConnectField
              chatId={telegram.chatId}
              username={telegram.username}
              isConnecting={telegram.isConnecting}
              isDisconnecting={telegram.isDisconnecting}
              onConnect={telegram.connect}
              onDisconnect={telegram.disconnect}
            />
          )}
          <ThresholdField
            threshold={form.threshold}
            thresholdText={form.thresholdText}
            chainName={chainName}
            onThresholdChange={threshold => updateForm({ threshold })}
            onThresholdTextChange={thresholdText => updateForm({ thresholdText })}
          />
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleStore}
              disabled={!canSubmitNotificationForm(submission) || isSaving}
              className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-medium hover:from-purple-600 hover:to-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
            {hasConfig && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            )}
            <button
              onClick={handleCancel}
              className="px-4 py-2 rounded-lg border border-base-300 bg-base-200 text-base-content font-medium hover:bg-base-300 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        summary
      )}
    </NotificationCard>
  );
};
