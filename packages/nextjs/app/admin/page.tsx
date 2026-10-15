"use client";

import { type ReactNode, useEffect, useState } from "react";
import type { NextPage } from "next";
import { type Address, type Hash, erc20Abi, isAddress } from "viem";
import { useAccount, useBalance, useReadContract } from "wagmi";
import type { TxPhase } from "~~/app/admin/_components/AdminCard";
import { ContractOverview } from "~~/app/admin/_components/ContractOverview";
import { MAX_DURATION_FIELD_IDS, MaxDurationCard } from "~~/app/admin/_components/MaxDurationCard";
import { PageHeader } from "~~/app/admin/_components/PageHeader";
import { PauseCard } from "~~/app/admin/_components/PauseCard";
import { PLAN_FIELD_IDS, PlanCard } from "~~/app/admin/_components/PlanCard";
import { TRANSFER_FIELD_IDS, TransferOwnershipCard } from "~~/app/admin/_components/TransferOwnershipCard";
import { NATIVE_WITHDRAW_FIELD_IDS, WithdrawNativeCard } from "~~/app/admin/_components/WithdrawNativeCard";
import { TOKEN_WITHDRAW_FIELD_IDS, WithdrawTokenCard } from "~~/app/admin/_components/WithdrawTokenCard";
import {
  type NativeWithdrawForm,
  type ParseResult,
  type PlanForm,
  type TokenWithdrawForm,
  parseMaxDuration,
  parseNativeWithdraw,
  parseNewOwner,
  parsePlanForm,
  parseTokenWithdraw,
} from "~~/app/admin/_components/adminForms";
import { type AdminTxError, describeAdminTxError } from "~~/app/admin/_components/adminTxError";
import { Alert, LiveRegion, Skeleton } from "~~/components/ui";
import { PAYMENT_CHAIN_ID, PAYMENT_CONTRACT_ADDRESS, PAYMENT_TOKEN_ADDRESS } from "~~/constants/payments";
import { useErc20Metadata } from "~~/hooks/custom/useErc20Metadata";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import scaffoldConfig from "~~/scaffold.config";

type AdminAction =
  | "pause"
  | "unpause"
  | "maxDuration"
  | "plan"
  | "withdrawNative"
  | "withdrawToken"
  | "transferOwnership";

/** A submit the parser refused: the action and the field it failed on. */
type SubmitFailure = { action: AdminAction; field: string };

const PAGE_TITLE = "Admin console";
const PAGE_DESCRIPTION =
  "Owner actions for the TokenpingPaywall contract, each sent as a transaction from the owner wallet.";

/** Settings width: one column of blocks, 768px at most. On phones its 20px gutter lines up with the header's. */
const AdminShell = ({ children }: { children: ReactNode }) => (
  <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-5 py-6 md:px-6 md:py-10">{children}</div>
);

const AdminPage: NextPage = () => {
  const { address: connectedAddress, isConnected } = useAccount();

  // Form state lives here (not in the cards) so typed values survive the cards unmounting on a wallet switch.
  const [planForm, setPlanForm] = useState<PlanForm>({
    tokenAddress: PAYMENT_TOKEN_ADDRESS ?? "",
    price: "",
    durationSeconds: "",
    enabled: true,
  });
  const [maxDurationSeconds, setMaxDurationSeconds] = useState("");
  const [nativeWithdrawForm, setNativeWithdrawForm] = useState<NativeWithdrawForm>({ to: "", amountEth: "" });
  const [tokenWithdrawForm, setTokenWithdrawForm] = useState<TokenWithdrawForm>({
    tokenAddress: PAYMENT_TOKEN_ADDRESS ?? "",
    to: "",
    amount: "",
  });
  const [newOwnerAddress, setNewOwnerAddress] = useState("");
  // One action at a time: the last one sent, and how it failed. Each card shows its own error and spinner.
  const [lastAction, setLastAction] = useState<AdminAction>();
  const [txError, setTxError] = useState<AdminTxError>();
  const [submitFailure, setSubmitFailure] = useState<SubmitFailure>();
  // A new object per failed submit, so a second failed submit on the same field moves focus there again.
  const [focusRequest, setFocusRequest] = useState<{ id: string }>();
  // The checked new owner while the transfer's confirm dialog is open.
  const [transferTarget, setTransferTarget] = useState<Address>();

  useEffect(() => {
    if (focusRequest) document.getElementById(focusRequest.id)?.focus();
  }, [focusRequest]);

  const {
    data: owner,
    isLoading: isOwnerLoading,
    refetch: refetchOwner,
  } = useScaffoldReadContract({
    contractName: "TokenpingPaywall",
    functionName: "owner",
    chainId: PAYMENT_CHAIN_ID,
  });

  const { data: paused, refetch: refetchPaused } = useScaffoldReadContract({
    contractName: "TokenpingPaywall",
    functionName: "paused",
    chainId: PAYMENT_CHAIN_ID,
  });

  const { data: maxDuration, refetch: refetchMaxDuration } = useScaffoldReadContract({
    contractName: "TokenpingPaywall",
    functionName: "maxDurationSeconds",
    chainId: PAYMENT_CHAIN_ID,
  });

  const planToken = isAddress(planForm.tokenAddress) ? planForm.tokenAddress : undefined;
  const withdrawToken = isAddress(tokenWithdrawForm.tokenAddress) ? tokenWithdrawForm.tokenAddress : undefined;

  const { data: currentPlan, refetch: refetchPlan } = useScaffoldReadContract({
    contractName: "TokenpingPaywall",
    functionName: "plans",
    args: [planToken],
    chainId: PAYMENT_CHAIN_ID,
  });

  const planTokenMetadata = useErc20Metadata(planToken, PAYMENT_CHAIN_ID);
  const withdrawTokenMetadata = useErc20Metadata(withdrawToken, PAYMENT_CHAIN_ID);

  const { data: nativeBalance, refetch: refetchNativeBalance } = useBalance({
    address: PAYMENT_CONTRACT_ADDRESS,
    chainId: PAYMENT_CHAIN_ID,
    query: { enabled: Boolean(PAYMENT_CONTRACT_ADDRESS) },
  });

  const { data: contractTokenBalance, refetch: refetchTokenBalance } = useReadContract({
    abi: erc20Abi,
    address: withdrawToken,
    functionName: "balanceOf",
    args: PAYMENT_CONTRACT_ADDRESS ? [PAYMENT_CONTRACT_ADDRESS] : undefined,
    chainId: PAYMENT_CHAIN_ID,
    query: { enabled: Boolean(withdrawToken && PAYMENT_CONTRACT_ADDRESS) },
  });

  const { writeContractAsync, isPending, isMining } = useScaffoldWriteContract({
    contractName: "TokenpingPaywall",
    chainId: PAYMENT_CHAIN_ID,
  });

  const isOwner = Boolean(owner && connectedAddress && owner.toLowerCase() === connectedAddress.toLowerCase());
  const isBusy = isPending || isMining;
  // SE-2's isMining spans the whole send (simulation, wallet, receipt); wagmi's isPending is the wallet prompt only.
  const txPhase: TxPhase | undefined = isPending ? "wallet" : isMining ? "processing" : undefined;
  const paymentNetwork = scaffoldConfig.targetNetworks.find(chain => chain.id === PAYMENT_CHAIN_ID);

  // Parsed on every render: after a failed submit, the field's message follows the value and clears once it is fixed.
  const planParse = parsePlanForm(planForm, planTokenMetadata.decimals);
  const maxDurationParse = parseMaxDuration(maxDurationSeconds);
  const nativeWithdrawParse = parseNativeWithdraw(nativeWithdrawForm);
  const tokenWithdrawParse = parseTokenWithdraw(tokenWithdrawForm, withdrawTokenMetadata.decimals);
  const newOwnerParse = parseNewOwner(newOwnerAddress);

  const refetchAll = async () => {
    await Promise.all([
      refetchOwner(),
      refetchPaused(),
      refetchMaxDuration(),
      refetchPlan(),
      refetchNativeBalance(),
      refetchTokenBalance(),
    ]);
  };

  const executeAdminTx = async (action: AdminAction, sendTx: () => Promise<Hash | undefined>) => {
    if (isBusy) return;
    setLastAction(action);
    setTxError(undefined);
    setSubmitFailure(undefined);
    try {
      // undefined: nothing was sent (no wallet client, wrong network...), and SE-2 has already toasted why.
      if ((await sendTx()) === undefined) return;
      await refetchAll();
    } catch (error) {
      console.error(error);
      setTxError(
        describeAdminTxError(error, {
          network: paymentNetwork?.name ?? "the payment network",
          symbol: paymentNetwork?.nativeCurrency.symbol ?? "ETH",
        }),
      );
    }
  };

  /** Shows the parser's message at the field it failed on and focuses that field; true when the value parsed. */
  const checkSubmit = <T, F extends string>(
    action: AdminAction,
    parsed: ParseResult<T, F>,
    fieldIds: Record<F, string>,
  ): parsed is { value: T } => {
    if (!("error" in parsed)) return true;
    setLastAction(action);
    setTxError(undefined);
    setSubmitFailure({ action, field: parsed.field });
    setFocusRequest({ id: fieldIds[parsed.field] });
    return false;
  };

  /** The live message for the field this action's last submit failed on, while that field still fails. */
  const fieldErrorsFor = <F extends string>(action: AdminAction, parsed: ParseResult<unknown, F>) =>
    submitFailure?.action === action && "error" in parsed && parsed.field === submitFailure.field
      ? ({ [parsed.field]: parsed.error } as Partial<Record<F, string>>)
      : undefined;

  const handlePause = () => executeAdminTx("pause", () => writeContractAsync({ functionName: "pause" }));

  const handleUnpause = () => executeAdminTx("unpause", () => writeContractAsync({ functionName: "unpause" }));

  const handleSetPlan = () => {
    if (isBusy || !checkSubmit("plan", planParse, PLAN_FIELD_IDS)) return;
    return executeAdminTx("plan", () => writeContractAsync({ functionName: "setPlan", args: planParse.value }));
  };

  const handleSetMaxDuration = () => {
    if (isBusy || !checkSubmit("maxDuration", maxDurationParse, MAX_DURATION_FIELD_IDS)) return;
    return executeAdminTx("maxDuration", () =>
      writeContractAsync({ functionName: "setMaxDurationSeconds", args: [maxDurationParse.value] }),
    );
  };

  const handleWithdrawNative = () => {
    if (isBusy || !checkSubmit("withdrawNative", nativeWithdrawParse, NATIVE_WITHDRAW_FIELD_IDS)) return;
    return executeAdminTx("withdrawNative", () =>
      writeContractAsync({ functionName: "withdrawNative", args: nativeWithdrawParse.value }),
    );
  };

  const handleWithdrawToken = () => {
    if (isBusy || !checkSubmit("withdrawToken", tokenWithdrawParse, TOKEN_WITHDRAW_FIELD_IDS)) return;
    return executeAdminTx("withdrawToken", () =>
      writeContractAsync({ functionName: "withdrawTokens", args: tokenWithdrawParse.value }),
    );
  };

  /** The transfer's submit only opens the confirm dialog; the dialog's confirm sends the transaction. */
  const handleReviewTransfer = () => {
    if (isBusy || !checkSubmit("transferOwnership", newOwnerParse, TRANSFER_FIELD_IDS)) return;
    setSubmitFailure(undefined);
    setTransferTarget(newOwnerParse.value);
  };

  const handleConfirmTransfer = () => {
    const newOwner = transferTarget;
    setTransferTarget(undefined);
    if (newOwner === undefined) return;
    return executeAdminTx("transferOwnership", () =>
      writeContractAsync({ functionName: "transferOwnership", args: [newOwner] }),
    );
  };

  const pendingFor = (...actions: AdminAction[]) =>
    lastAction !== undefined && actions.includes(lastAction) ? txPhase : undefined;
  const errorFor = (...actions: AdminAction[]) =>
    lastAction !== undefined && actions.includes(lastAction) ? txError : undefined;

  if (!PAYMENT_CHAIN_ID || !PAYMENT_CONTRACT_ADDRESS) {
    return (
      <AdminShell>
        <PageHeader title={PAGE_TITLE} description={PAGE_DESCRIPTION} />
        <Alert variant="destructive" title="Contract not deployed">
          TokenpingPaywall is not deployed on any configured target network.
        </Alert>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <PageHeader title={PAGE_TITLE} description={PAGE_DESCRIPTION} />
      <ContractOverview
        contractAddress={PAYMENT_CONTRACT_ADDRESS}
        owner={owner}
        isOwnerLoading={isOwnerLoading}
        chainId={PAYMENT_CHAIN_ID}
        paused={paused}
      />

      {/* Polite: the access state changes when a wallet connects or switches accounts. While empty, the negative
          margin cancels the gap the region would add. */}
      <LiveRegion className="flex flex-col gap-6 empty:-mb-6">
        {!isConnected ? (
          <Alert variant="info" title="Wallet not connected">
            Connect the owner wallet to use the admin actions.
          </Alert>
        ) : null}
        {isConnected && !isOwnerLoading && !isOwner ? (
          <Alert variant="warning" title="This wallet is not the owner">
            Only the contract owner can use the admin actions. Switch to the owner wallet to continue.
          </Alert>
        ) : null}
      </LiveRegion>

      {isConnected && isOwnerLoading ? (
        <div aria-busy="true" className="flex flex-col gap-6">
          <span role="status" className="sr-only">
            Checking the contract owner
          </span>
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : null}

      {isConnected && isOwner ? (
        <>
          <PauseCard
            paused={paused}
            isBusy={isBusy}
            pending={pendingFor("pause", "unpause")}
            error={errorFor("pause", "unpause")}
            onPause={handlePause}
            onUnpause={handleUnpause}
          />
          <MaxDurationCard
            maxDuration={maxDuration}
            value={maxDurationSeconds}
            onChange={setMaxDurationSeconds}
            isBusy={isBusy}
            pending={pendingFor("maxDuration")}
            error={errorFor("maxDuration")}
            fieldErrors={fieldErrorsFor("maxDuration", maxDurationParse)}
            onSubmit={handleSetMaxDuration}
          />
          <PlanCard
            form={planForm}
            onChange={patch => setPlanForm(form => ({ ...form, ...patch }))}
            tokenDecimals={planTokenMetadata.decimals}
            isDecimalsLoading={planTokenMetadata.isDecimalsLoading}
            tokenSymbol={planTokenMetadata.symbol}
            currentPlan={currentPlan}
            isBusy={isBusy}
            pending={pendingFor("plan")}
            error={errorFor("plan")}
            fieldErrors={fieldErrorsFor("plan", planParse)}
            onSubmit={handleSetPlan}
          />
          <WithdrawNativeCard
            form={nativeWithdrawForm}
            onChange={patch => setNativeWithdrawForm(form => ({ ...form, ...patch }))}
            balance={nativeBalance?.value}
            isBusy={isBusy}
            pending={pendingFor("withdrawNative")}
            error={errorFor("withdrawNative")}
            fieldErrors={fieldErrorsFor("withdrawNative", nativeWithdrawParse)}
            onSubmit={handleWithdrawNative}
          />
          <WithdrawTokenCard
            form={tokenWithdrawForm}
            onChange={patch => setTokenWithdrawForm(form => ({ ...form, ...patch }))}
            balance={contractTokenBalance}
            tokenDecimals={withdrawTokenMetadata.decimals}
            isDecimalsLoading={withdrawTokenMetadata.isDecimalsLoading}
            tokenSymbol={withdrawTokenMetadata.symbol}
            isBusy={isBusy}
            pending={pendingFor("withdrawToken")}
            error={errorFor("withdrawToken")}
            fieldErrors={fieldErrorsFor("withdrawToken", tokenWithdrawParse)}
            onSubmit={handleWithdrawToken}
          />
          <TransferOwnershipCard
            value={newOwnerAddress}
            onChange={setNewOwnerAddress}
            isBusy={isBusy}
            pending={pendingFor("transferOwnership")}
            error={errorFor("transferOwnership")}
            fieldErrors={fieldErrorsFor("transferOwnership", newOwnerParse)}
            onReview={handleReviewTransfer}
            confirmTarget={transferTarget}
            onConfirm={handleConfirmTransfer}
            onCancelConfirm={() => setTransferTarget(undefined)}
          />
        </>
      ) : null}
    </AdminShell>
  );
};

export default AdminPage;
