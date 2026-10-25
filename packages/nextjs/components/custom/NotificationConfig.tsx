"use client";

import { type FormEvent, useEffect, useId, useMemo, useRef, useState } from "react";
import { Lock, Pencil } from "lucide-react";
import { useAccount } from "wagmi";
import { AttributionPrompt } from "~~/components/custom/notifications/AttributionPrompt";
import { NotificationCard } from "~~/components/custom/notifications/NotificationCard";
import { NotificationEmptyState } from "~~/components/custom/notifications/NotificationEmptyState";
import { NotificationErrorSummary } from "~~/components/custom/notifications/NotificationErrorSummary";
import { NotificationFormActions } from "~~/components/custom/notifications/NotificationFormActions";
import { NotificationLoadError } from "~~/components/custom/notifications/NotificationLoadError";
import { NotificationSignIn } from "~~/components/custom/notifications/NotificationSignIn";
import { NotificationSummary } from "~~/components/custom/notifications/NotificationSummary";
import { RecipientFields } from "~~/components/custom/notifications/RecipientFields";
import { ServiceSelector } from "~~/components/custom/notifications/ServiceSelector";
import { ThresholdField } from "~~/components/custom/notifications/ThresholdField";
import { useAttributionPrompt } from "~~/components/custom/notifications/attributionPromptState";
import {
  EMPTY_FORM_STATE,
  NOTIFICATION_FORM_FIELDS,
  type NotificationFormField,
  type NotificationFormState,
  buildConfigUpdate,
  channelLocaleOf,
  configToFormState,
  getNotificationFormErrors,
  needsErrorSummary,
  toggleService,
} from "~~/components/custom/notifications/notificationForm";
import { Button, LiveRegion } from "~~/components/ui";
import type { MarketId, MarketRef } from "~~/config/aaveConfig";
import { type Protocol, isMorphoProtocol } from "~~/config/protocols";
import { NOTIFICATION_SERVICES } from "~~/constants/notifications";
import { useAccess } from "~~/hooks/custom/useAccess";
import { useNotificationConfig } from "~~/hooks/custom/useNotificationConfig";
import { useNotificationTests } from "~~/hooks/custom/useNotificationTests";
import { hasSignedInHere, useWalletSession, useWalletSignIn } from "~~/hooks/custom/useWalletSession";
import { useLocale } from "~~/i18n/LocaleProvider";
import type { MarketNameKind } from "~~/i18n/format";
import type { Locale } from "~~/i18n/locales";
import { ALERTS_MESSAGES, requestErrorMessage } from "~~/i18n/messages/alerts";
import { TestSendError } from "~~/services/notifications/notificationTestClient";
import type { NotificationService } from "~~/types/notifications";
import { normalizeAddress } from "~~/utils/address";
import { isUserRejection } from "~~/utils/errors";
import { isBelowThreshold } from "~~/utils/healthFactor";
import { thresholdRangeFor } from "~~/utils/notifications/threshold";
import { notification } from "~~/utils/scaffold-eth";

type NotificationConfigProps = {
  /** The position's chain (the network this config is for). Must match position.chainId, not wallet's connected chain. */
  chainId: number;
  /** The market on that chain: position.marketId ("v3" or a V4 Spoke), or a Morpho market id. */
  market: MarketId;
  /** Aave's when left out. Sets the threshold range and the alert's protocol. */
  protocol?: Protocol;
  /** The market's name in copy: position.marketName ("Ethereum", "Ethereum (V4 Lido)"). */
  chainName: string;
  /** What `chainName` names, for Czech grammar; read from an Aave label when left out. */
  chainNameKind?: MarketNameKind;
  currentHealthFactor: string;
};

const NotificationSettings = ({
  address,
  chainId,
  market,
  protocol,
  chainName,
  chainNameKind,
  currentHealthFactor,
}: NotificationConfigProps & { address: string | undefined }) => {
  const locale = useLocale();
  const t = ALERTS_MESSAGES[locale];
  const { getConfig, updateConfig, deleteConfig, isLoaded, isError, isFetching, refetch, isSaving, isDeleting } =
    useNotificationConfig();
  const { isActive: hasAccess } = useAccess();
  const session = useWalletSession();
  const walletSignIn = useWalletSignIn();
  const signedInHereBefore = useMemo(() => !!address && hasSignedInHere(address), [address]);
  const attribution = useAttributionPrompt(address);
  const tests = useNotificationTests();
  // An Aave ref names no protocol, as before Morpho.
  const marketRef: MarketRef = isMorphoProtocol(protocol) ? { chainId, market, protocol } : { chainId, market };
  const range = thresholdRangeFor(protocol);
  const config = getConfig(marketRef);
  // What the summary shows. Editing works on a draft copy, so Cancel only has to drop the draft.
  const saved = configToFormState(config, range);
  /** Every channel's language, the page's where none was picked: what the selects and the summary show. */
  const channelLocalesOf = (form: NotificationFormState) =>
    Object.fromEntries(
      NOTIFICATION_SERVICES.map(channel => [channel, channelLocaleOf(form, channel, locale)]),
    ) as Record<NotificationService, Locale>;

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

  useEffect(() => {
    if (walletSignIn.error && !isUserRejection(walletSignIn.error)) {
      console.error("Failed to sign in:", walletSignIn.error);
    }
  }, [walletSignIn.error]);

  // The API answers only for the signed-in wallet. A wallet that paid signs in here, once per session; a draft being
  // edited survives a session that ends, and is back after signing in again. Without paid access the paywall is
  // enough, except for a wallet that has signed in on this browser before: its access may have lapsed with an alert
  // still saved, which it can see read-only after signing in.
  if (address && !session.isSignedIn) {
    if (session.isChecking || (!hasAccess && !signedInHereBefore)) return null;
    const signInError = walletSignIn.error
      ? isUserRejection(walletSignIn.error)
        ? t.signInRejected
        : t.signInFailed
      : null;
    return (
      <NotificationSignIn
        isPrimary={hasAccess}
        isSigningIn={walletSignIn.isSigningIn}
        errorMessage={signInError}
        onSignIn={walletSignIn.signIn}
      />
    );
  }

  if (!isLoaded) return null;

  if (isError) return <NotificationLoadError isRetrying={isFetching} onRetry={() => void refetch()} />;

  const hasConfig = config !== null;

  const handleSendTest = async (channel: NotificationService) => {
    const channelName = t.serviceNames[channel];
    setAnnouncement("");
    try {
      await tests.send(marketRef, channel);
      notification.success(t.testSent(channelName));
      setAnnouncement(t.testSent(channelName));
    } catch (error) {
      // Refused by the 15-minute limit: say when it frees up, counted from the server's answer (this render's
      // countdown predates it).
      const message =
        error instanceof TestSendError && error.retryAt
          ? t.testAgainIn(Math.max(1, Math.ceil((Date.parse(error.retryAt) - Date.now()) / 60_000)))
          : requestErrorMessage(locale, error, t.testFailed);
      notification.error(message);
      setAnnouncement(message);
    }
  };

  // No access and no config: the paywall above is enough.
  if (!hasAccess && !hasConfig) return null;

  const summary = (
    <NotificationSummary
      services={saved.services}
      email={saved.email}
      signalRecipient={saved.signalRecipient}
      telegramUsername={saved.telegramUsername}
      channelLocales={channelLocalesOf(saved)}
      threshold={saved.threshold}
      currentHealthFactor={currentHealthFactor}
      showBelowThresholdWarning={saved.enabled && isBelowThreshold(currentHealthFactor, saved.threshold)}
      // The server refuses a test without access, so the buttons only show with it.
      testSends={
        hasAccess
          ? {
              waitFor: tests.waitFor,
              sendingChannel: tests.sendingChannel,
              onSend: channel => void handleSendTest(channel),
            }
          : undefined
      }
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
  const currentErrors = getNotificationFormErrors(draft, locale);
  const errorFor = (field: NotificationFormField) => (invalidFields.includes(field) ? currentErrors[field] : undefined);
  const errorSummaryItems = invalidFields.flatMap(field => {
    const message = currentErrors[field];
    return message === undefined ? [] : [{ field, message, targetId: fieldIds[field] }];
  });

  /** Focuses the first control of a field: a checkbox or an input. */
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
      await updateConfig(marketRef, buildConfigUpdate(draft, locale, range));
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
      await deleteConfig(marketRef);
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
    restoreFocusOnClose.current = true;
    setIsEditing(false);
  };

  if (!hasConfig && !isEditing) {
    return (
      <NotificationEmptyState
        chainName={chainName}
        chainNameKind={chainNameKind}
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
            telegramFieldId={fieldIds.telegram}
            services={draft.services}
            email={draft.email}
            signalRecipient={draft.signalRecipient}
            telegramUsername={draft.telegramUsername}
            channelLocales={channelLocalesOf(draft)}
            emailError={errorFor("email")}
            signalError={errorFor("signalRecipient")}
            telegramError={errorFor("telegram")}
            onEmailChange={email => updateDraft({ email })}
            onSignalRecipientChange={signalRecipient => updateDraft({ signalRecipient })}
            onTelegramUsernameChange={telegramUsername => updateDraft({ telegramUsername })}
            onChannelLocaleChange={(channel, channelLocale) =>
              setDraft(prev => ({ ...prev, channelLocales: { ...prev.channelLocales, [channel]: channelLocale } }))
            }
          />
          <ThresholdField
            threshold={draft.threshold}
            thresholdText={draft.thresholdText}
            chainName={chainName}
            chainNameKind={chainNameKind}
            range={range}
            onThresholdChange={threshold => updateDraft({ threshold })}
            onThresholdTextChange={thresholdText => updateDraft({ thresholdText })}
          />
          <NotificationFormActions
            chainName={chainName}
            chainNameKind={chainNameKind}
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
  // One instance per wallet, so a draft never carries over to another account.
  return <NotificationSettings key={address ? normalizeAddress(address) : ""} address={address} {...props} />;
};
