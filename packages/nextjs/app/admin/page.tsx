"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { erc20Abi, isAddress } from "viem";
import { useAccount, useBalance, useReadContract } from "wagmi";
import { ContractOverview } from "~~/app/admin/_components/ContractOverview";
import { MaxDurationCard } from "~~/app/admin/_components/MaxDurationCard";
import { PauseCard } from "~~/app/admin/_components/PauseCard";
import { PlanCard } from "~~/app/admin/_components/PlanCard";
import { TransferOwnershipCard } from "~~/app/admin/_components/TransferOwnershipCard";
import { WithdrawNativeCard } from "~~/app/admin/_components/WithdrawNativeCard";
import { WithdrawTokenCard } from "~~/app/admin/_components/WithdrawTokenCard";
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
import { PAYMENT_CHAIN_ID, PAYMENT_CONTRACT_ADDRESS, PAYMENT_TOKEN_ADDRESS } from "~~/constants/payments";
import { useErc20Metadata } from "~~/hooks/custom/useErc20Metadata";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { getErrorMessage } from "~~/utils/errors";

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
  const [txError, setTxError] = useState("");

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

  const executeAdminTx = async (sendTx: () => Promise<unknown>) => {
    setTxError("");
    try {
      await sendTx();
      await refetchAll();
    } catch (error) {
      setTxError(getErrorMessage(error, "Transaction failed"));
    }
  };

  /** Shows the parse error, or sends the transaction with the parsed value. */
  const submitAdminTx = async <T,>(parsed: ParseResult<T>, sendTx: (value: T) => Promise<unknown>) => {
    if ("error" in parsed) {
      setTxError(parsed.error);
      return;
    }
    await executeAdminTx(() => sendTx(parsed.value));
  };

  const handlePause = () => executeAdminTx(() => writeContractAsync({ functionName: "pause" }));

  const handleUnpause = () => executeAdminTx(() => writeContractAsync({ functionName: "unpause" }));

  const handleSetPlan = () =>
    submitAdminTx(parsePlanForm(planForm, planTokenMetadata.decimals), args =>
      writeContractAsync({ functionName: "setPlan", args }),
    );

  const handleSetMaxDuration = () =>
    submitAdminTx(parseMaxDuration(maxDurationSeconds), duration =>
      writeContractAsync({ functionName: "setMaxDurationSeconds", args: [duration] }),
    );

  const handleWithdrawNative = () =>
    submitAdminTx(parseNativeWithdraw(nativeWithdrawForm), args =>
      writeContractAsync({ functionName: "withdrawNative", args }),
    );

  const handleWithdrawToken = () =>
    submitAdminTx(parseTokenWithdraw(tokenWithdrawForm, withdrawTokenMetadata.decimals), args =>
      writeContractAsync({ functionName: "withdrawTokens", args }),
    );

  const handleTransferOwnership = () =>
    submitAdminTx(parseNewOwner(newOwnerAddress), newOwner =>
      writeContractAsync({ functionName: "transferOwnership", args: [newOwner] }),
    );

  if (!PAYMENT_CHAIN_ID || !PAYMENT_CONTRACT_ADDRESS) {
    return (
      <div className="min-h-screen bg-base-200 p-6">
        <div className="max-w-4xl mx-auto alert alert-error">
          <span>`TokenpingPaywall` is not deployed on any configured target network.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 dark:bg-gradient-to-br dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950">
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 space-y-6">
        <ContractOverview
          contractAddress={PAYMENT_CONTRACT_ADDRESS}
          owner={owner}
          chainId={PAYMENT_CHAIN_ID}
          paused={paused}
        />

        {!isConnected ? (
          <div className="alert alert-warning">
            <span>Connect your wallet to access admin actions.</span>
          </div>
        ) : null}

        {isConnected && !isOwnerLoading && !isOwner ? (
          <div className="alert alert-error">
            <span>Access denied. Only smart contract owner can use this page.</span>
          </div>
        ) : null}

        {txError ? (
          <div className="alert alert-error">
            <span>{txError}</span>
          </div>
        ) : null}

        {isConnected && isOwner ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <PauseCard paused={paused} isBusy={isBusy} onPause={handlePause} onUnpause={handleUnpause} />
            <MaxDurationCard
              maxDuration={maxDuration}
              value={maxDurationSeconds}
              onChange={setMaxDurationSeconds}
              isBusy={isBusy}
              onSubmit={handleSetMaxDuration}
            />
            <PlanCard
              form={planForm}
              onChange={patch => setPlanForm(form => ({ ...form, ...patch }))}
              tokenDecimals={planTokenMetadata.decimals}
              tokenSymbol={planTokenMetadata.symbol}
              currentPlan={currentPlan}
              isBusy={isBusy}
              onSubmit={handleSetPlan}
            />
            <WithdrawNativeCard
              form={nativeWithdrawForm}
              onChange={patch => setNativeWithdrawForm(form => ({ ...form, ...patch }))}
              balance={nativeBalance?.value}
              isBusy={isBusy}
              onSubmit={handleWithdrawNative}
            />
            <WithdrawTokenCard
              form={tokenWithdrawForm}
              onChange={patch => setTokenWithdrawForm(form => ({ ...form, ...patch }))}
              balance={contractTokenBalance}
              tokenDecimals={withdrawTokenMetadata.decimals}
              tokenSymbol={withdrawTokenMetadata.symbol}
              isBusy={isBusy}
              onSubmit={handleWithdrawToken}
            />
            <TransferOwnershipCard
              value={newOwnerAddress}
              onChange={setNewOwnerAddress}
              isBusy={isBusy}
              onSubmit={handleTransferOwnership}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default AdminPage;
