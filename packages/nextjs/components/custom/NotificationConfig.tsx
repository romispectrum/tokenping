"use client";

import { type FormEvent, useEffect, useId, useRef, useState } from "react";
import { Lock, Pencil } from "lucide-react";
import { useAccount } from "wagmi";
import { AttributionPrompt } from "~~/components/custom/notifications/AttributionPrompt";
import { NotificationCard } from "~~/components/custom/notifications/NotificationCard";
import { NotificationEmptyState } from "~~/components/custom/notifications/NotificationEmptyState";
import { NotificationErrorSummary } from "~~/components/custom/notifications/NotificationErrorSummary";
import { NotificationFormActions } from "~~/components/custom/notifications/NotificationFormActions";
import { NotificationLoadError } from "~~/components/custom/notifications/NotificationLoadError";
import { NotificationSummary } from "~~/components/custom/notifications/NotificationSummary";
import { RecipientFields } from "~~/components/custom/notifications/RecipientFields";
import { ServiceSelector } from "~~/components/custom/notifications/ServiceSelector";
import { TelegramConnectField } from "~~/components/custom/notifications/TelegramConnectField";
import { ThresholdField } from "~~/components/custom/notifications/ThresholdField";
import { useAttributionPrompt } from "~~/components/custom/notifications/attributionPromptState";
import {
  EMPTY_FORM_STATE,
  NOTIFICATION_FORM_FIELDS,
  type NotificationFormField,
  type NotificationFormState,
  buildConfigUpdate,
  configToFormState,
  getNotificationFormErrors,
  needsErrorSummary,
  toggleService,
} from "~~/components/custom/notifications/notificationForm";
import { Button, LiveRegion } from "~~/components/ui";
import { useAccess } from "~~/hooks/custom/useAccess";
import { useNotificationConfig } from "~~/hooks/custom/useNotificationConfig";
import { useTelegramLink } from "~~/hooks/custom/useTelegramLink";
import { useLocale } from "~~/i18n/LocaleProvider";
import { ALERTS_MESSAGES, requestErrorMessage } from "~~/i18n/messages/alerts";
import { normalizeAddress } from "~~/utils/address";
import { isBelowThreshold } from "~~/utils/healthFactor";
import { notification } from "~~/utils/scaffold-eth";

type NotificationConfigProps = {
  /** Aave/position chain (the network this config is for). Must match position.chainId, not wallet's connected chain. */
  chainId: number;
  chainName: string;
  currentHealthFactor: string;
};

const NotificationSettings = ({
  address,
  chainId,
  chainName,
  currentHealthFactor,
}: NotificationConfigProps & { address: string | undefined }) => {
  const locale = useLocale();
  const t = ALERTS_MESSAGES[locale];
  const { getConfig, updateConfig, deleteConfig, isLoaded, isError, isFetching, refetch, isSaving, isDeleting } =
    useNotificationConfig();
  const { isActive: hasAccess } = useAccess();
  const telegram = useTelegramLink(address);
  const attribution = useAttributionPrompt(address);
  const config = getConfig(chainId);
  // What the summary shows. Editing works on a draft copy, so Cancel only has to drop the draft.
  const saved = configToFormState(config);

  const [draft, setDraft] = useState(EMPTY_FORM_STATE);
  const [isEditing, setIsEditing] = useState(false);
  // The fields that failed the last Save. Their messages follow the draft, so an error clears as soon as it is
  // fixed, while a field that was fine (or hidden) at that Save stays quiet until the next one.
  const [invalidFields, setInvalidFields] = useState<readonly NotificationFormField[]>([]);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  // Raised by each failed Save that shows the error summary, so the summary takes focus again; 0 hides it.
  const [errorSummaryRequest, setErrorSummaryRequest] = useState(0);
  // What happened to the last Save, Delete or attribution answer, for screen readers. The toasts are not announced,
  // and the button that was pressed is often gone, so this region sits outside the form and outlives it.
  const [announcement, setAnnouncement] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const createRef = useRef<HTMLButtonElement>(null);
  // Set when Save or Cancel closes the form without handing focus to the attribution prompt.
  const restoreFocusOnClose = useRef(false);
  const formId = useId();
  const fieldIds: Record<NotificationFormField, string> = {
    services: `${formId}-services`,
    email: `${formId}-email`,
    signalRecipient: `${formId}-signal`,
    telegram: `${formId}-telegram`,
  };

  useEffect(() => {
    if (errorSummaryRequest > 0) errorSummaryRef.current?.focus();
  }, [errorSummaryRequest]);

  useEffect(() => {
    if (isEditing || !restoreFocusOnClose.current) return;
    restoreFocusOnClose.current = false;
    // The button that opened the form: Edit alert for a saved config, otherwise Create alert.
    (attribution.returnFocusRef.current ?? createRef.current)?.focus();
  }, [isEditing, attribution.returnFocusRef]);

  if (!isLoaded || !telegram.isLoaded) return null;

  if (isError) return <NotificationLoadError isRetrying={isFetching} onRetry={() => void refetch()} />;

  const hasConfig = config !== null;

  // No access and no config: the paywall above is enough.
  if (!hasAccess && !hasConfig) return null;

  const summary = (
    <NotificationSummary
      services={saved.services}
      email={saved.email}
      signalRecipient={saved.signalRecipient}
      telegramChatId={telegram.chatId}
      telegramUsername={telegram.username}
      threshold={saved.threshold}
      currentHealthFactor={currentHealthFactor}
      showBelowThresholdWarning={saved.enabled && isBelowThreshold(currentHealthFactor, saved.threshold)}
    />
  );

  // Access lapsed but a config exists: read-only summary.
  if (!hasAccess) {
    return (
      <NotificationCard
        isActive={saved.enabled}
        headerRight={
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Lock aria-hidden="true" className="size-4 shrink-0" />
            {t.payToEdit}
          </span>
        }
      >
        {summary}
      </NotificationCard>
    );
  }

  const startEditing = (form: NotificationFormState) => {
    setDraft(form);
    setInvalidFields([]);
    setErrorSummaryRequest(0);
    setIsConfirmingDelete(false);
    setAnnouncement("");
    setIsEditing(true);
  };

  const updateDraft = (patch: Partial<NotificationFormState>) => setDraft(prev => ({ ...prev, ...patch }));
  const submission = { ...draft, telegramChatId: telegram.chatId, telegramStatusUnknown: telegram.isStatusUnknown };
  const currentErrors = getNotificationFormErrors(submission, locale);
  const errorFor = (field: NotificationFormField) => (invalidFields.includes(field) ? currentErrors[field] : undefined);
  const errorSummaryItems = invalidFields.flatMap(field => {
    const message = currentErrors[field];
    return message === undefined ? [] : [{ field, message, targetId: fieldIds[field] }];
  });

  /** Focuses the first control of a field: a checkbox, an input or the Telegram button. */
  const focusField = (field: NotificationFormField) =>
    formRef.current
      ?.querySelector<HTMLElement>(`[data-field="${field}"] input, [data-field="${field}"] button`)
      ?.focus();

  // Validated on Save, never by disabling it: the errors appear under their fields, and focus moves to the error
  // summary when the form is long enough to have one, otherwise to the first invalid field.
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;
    const failed = NOTIFICATION_FORM_FIELDS.filter(field => currentErrors[field] !== undefined);
    setInvalidFields(failed);
    setAnnouncement("");
    if (failed.length > 0) {
      if (needsErrorSummary(draft.services)) {
        setErrorSummaryRequest(request => request + 1);
      } else {
        setErrorSummaryRequest(0);
        focusField(failed[0]);
      }
      return;
    }
    setErrorSummaryRequest(0);

    try {
      await updateConfig(chainId, buildConfigUpdate(draft));
      notification.success(t.alertSaved);
      setAnnouncement(t.alertSaved);
      // Save goes away with the form: the attribution prompt takes focus if it opens, otherwise Edit alert does.
      restoreFocusOnClose.current = !attribution.offer();
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save notification config:", error);
      const message = requestErrorMessage(locale, error, t.saveFailed);
      notification.error(message);
      setAnnouncement(message);
    }
  };

  const handleDelete = async () => {
    setAnnouncement("");
    try {
      await deleteConfig(chainId);
      startEditing(EMPTY_FORM_STATE);
      setAnnouncement(t.alertDeleted);
      // The Delete button is gone: continue at the start of the empty form.
      focusField("services");
    } catch (error) {
      console.error("Failed to delete notification config:", error);
      const message = requestErrorMessage(locale, error, t.deleteFailed);
      notification.error(message);
      setAnnouncement(message);
    }
  };

  const handleCancel = () => {
    telegram.cancelConnect();
    restoreFocusOnClose.current = true;
    setIsEditing(false);
  };

  if (!hasConfig && !isEditing) {
    return (
      <NotificationEmptyState
        chainName={chainName}
        createRef={createRef}
        onCreate={() => startEditing(EMPTY_FORM_STATE)}
      />
    );
  }

  return (
    <NotificationCard
      isActive={hasConfig && saved.enabled}
      headerRight={
        !isEditing && (
          <Button ref={attribution.returnFocusRef} variant="outline" size="sm" onClick={() => startEditing(saved)}>
            <Pencil aria-hidden="true" />
            {t.editAlert}
          </Button>
        )
      }
    >
      {isEditing ? (
        <form ref={formRef} noValidate onSubmit={handleSubmit} className="flex flex-col gap-6">
          {errorSummaryRequest > 0 && errorSummaryItems.length > 0 && (
            <NotificationErrorSummary ref={errorSummaryRef} items={errorSummaryItems} onSelect={focusField} />
          )}
          <ServiceSelector
            id={fieldIds.services}
            services={draft.services}
            error={errorFor("services")}
            onToggle={service => setDraft(prev => ({ ...prev, services: toggleService(prev.services, service) }))}
          />
          <RecipientFields
            emailFieldId={fieldIds.email}
            signalFieldId={fieldIds.signalRecipient}
            services={draft.services}
            email={draft.email}
            signalRecipient={draft.signalRecipient}
            emailError={errorFor("email")}
            signalError={errorFor("signalRecipient")}
            onEmailChange={email => updateDraft({ email })}
            onSignalRecipientChange={signalRecipient => updateDraft({ signalRecipient })}
          />
          {draft.services.includes("telegram") && (
            <TelegramConnectField
              id={fieldIds.telegram}
              chatId={telegram.chatId}
              username={telegram.username}
              deepLink={telegram.deepLink}
              isStatusUnknown={telegram.isStatusUnknown}
              isCheckingStatus={telegram.isCheckingStatus}
              isConnecting={telegram.isConnecting}
              isDisconnecting={telegram.isDisconnecting}
              error={errorFor("telegram")}
              onRetryStatus={telegram.retryStatus}
              onConnect={telegram.connect}
              onDisconnect={telegram.disconnect}
            />
          )}
          <ThresholdField
            threshold={draft.threshold}
            thresholdText={draft.thresholdText}
            chainName={chainName}
            onThresholdChange={threshold => updateDraft({ threshold })}
            onThresholdTextChange={thresholdText => updateDraft({ thresholdText })}
          />
          <NotificationFormActions
            chainName={chainName}
            canDelete={hasConfig}
            isSaving={isSaving}
            isDeleting={isDeleting}
            isConfirmingDelete={isConfirmingDelete}
            onCancel={handleCancel}
            onRequestDelete={() => setIsConfirmingDelete(true)}
            onKeep={() => setIsConfirmingDelete(false)}
            onConfirmDelete={() => void handleDelete()}
          />
        </form>
      ) : (
        <>
          {summary}
          {attribution.isOpen && address && (
            <AttributionPrompt
              address={address}
              autoFocus={attribution.focusOnShow}
              onSent={() => setAnnouncement(t.answerSent)}
              onClose={attribution.close}
            />
          )}
        </>
      )}
      <LiveRegion className="sr-only">{announcement}</LiveRegion>
    </NotificationCard>
  );
};

export const NotificationConfig = (props: NotificationConfigProps) => {
  const { address } = useAccount();
  // One instance per wallet, so a draft never carries over to another account. The Telegram handshake outlives a
  // remount for the same wallet (a chain switch, a positions refresh); useTelegramLink ends it once the wallet
  // disconnects or switches, even if no card is left on the page.
  return <NotificationSettings key={address ? normalizeAddress(address) : ""} address={address} {...props} />;
};
