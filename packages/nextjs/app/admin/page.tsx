"use client";

import { useMemo, useState } from "react";
import { Address } from "@scaffold-ui/components";
import type { NextPage } from "next";
import { erc20Abi, formatEther, formatUnits, isAddress, parseEther, parseUnits } from "viem";
import { useAccount, useBalance, useReadContract } from "wagmi";
import { getPaymentChainId, getPaymentContractAddress, getPaymentTokenAddress } from "~~/constants/payments";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import type { AllowedChainIds } from "~~/utils/scaffold-eth";

const AdminPage: NextPage = () => {
  const { address: connectedAddress, isConnected } = useAccount();

  const paymentChainId = getPaymentChainId();
  const paymentContractAddress = paymentChainId != null ? getPaymentContractAddress(paymentChainId) : null;
  const defaultPaymentTokenAddress = paymentChainId != null ? getPaymentTokenAddress(paymentChainId) : null;
  const chainId = (paymentChainId ?? undefined) as AllowedChainIds | undefined;

  const [planTokenAddress, setPlanTokenAddress] = useState(defaultPaymentTokenAddress ?? "");
  const [planPrice, setPlanPrice] = useState("");
  const [planDurationSeconds, setPlanDurationSeconds] = useState("");
  const [planEnabled, setPlanEnabled] = useState(true);

  const [maxDurationSeconds, setMaxDurationSeconds] = useState("");

  const [withdrawNativeTo, setWithdrawNativeTo] = useState("");
  const [withdrawNativeAmountEth, setWithdrawNativeAmountEth] = useState("");

  const [withdrawTokenAddress, setWithdrawTokenAddress] = useState(defaultPaymentTokenAddress ?? "");
  const [withdrawTokenTo, setWithdrawTokenTo] = useState("");
  const [withdrawTokenAmount, setWithdrawTokenAmount] = useState("");

  const [newOwnerAddress, setNewOwnerAddress] = useState("");
  const [txError, setTxError] = useState("");

  const {
    data: owner,
    isLoading: isOwnerLoading,
    refetch: refetchOwner,
  } = useScaffoldReadContract({
    contractName: "TokenpingPaywall",
    functionName: "owner",
    chainId,
  });

  const { data: paused, refetch: refetchPaused } = useScaffoldReadContract({
    contractName: "TokenpingPaywall",
    functionName: "paused",
    chainId,
  });

  const { data: maxDuration, refetch: refetchMaxDuration } = useScaffoldReadContract({
    contractName: "TokenpingPaywall",
    functionName: "maxDurationSeconds",
    chainId,
  });

  const normalizedPlanToken = isAddress(planTokenAddress) ? (planTokenAddress as `0x${string}`) : undefined;
  const normalizedWithdrawToken = isAddress(withdrawTokenAddress) ? (withdrawTokenAddress as `0x${string}`) : undefined;
  const normalizedContractAddress =
    paymentContractAddress && isAddress(paymentContractAddress) ? (paymentContractAddress as `0x${string}`) : undefined;

  const { data: currentPlan, refetch: refetchPlan } = useScaffoldReadContract({
    contractName: "TokenpingPaywall",
    functionName: "plans",
    args: [normalizedPlanToken],
    chainId,
  });

  const { data: planTokenDecimals } = useReadContract({
    abi: erc20Abi,
    address: normalizedPlanToken,
    functionName: "decimals",
    chainId,
    query: { enabled: Boolean(normalizedPlanToken) },
  });

  const { data: planTokenSymbol } = useReadContract({
    abi: erc20Abi,
    address: normalizedPlanToken,
    functionName: "symbol",
    chainId,
    query: { enabled: Boolean(normalizedPlanToken) },
  });

  const { data: withdrawTokenDecimals } = useReadContract({
    abi: erc20Abi,
    address: normalizedWithdrawToken,
    functionName: "decimals",
    chainId,
    query: { enabled: Boolean(normalizedWithdrawToken) },
  });

  const { data: withdrawTokenSymbol } = useReadContract({
    abi: erc20Abi,
    address: normalizedWithdrawToken,
    functionName: "symbol",
    chainId,
    query: { enabled: Boolean(normalizedWithdrawToken) },
  });

  const { data: nativeBalance, refetch: refetchNativeBalance } = useBalance({
    address: normalizedContractAddress,
    chainId,
    query: { enabled: Boolean(normalizedContractAddress) },
  });

  const { data: contractTokenBalance, refetch: refetchTokenBalance } = useReadContract({
    abi: erc20Abi,
    address: normalizedWithdrawToken,
    functionName: "balanceOf",
    args: normalizedContractAddress ? [normalizedContractAddress] : undefined,
    chainId,
    query: { enabled: Boolean(normalizedWithdrawToken && normalizedContractAddress) },
  });

  const { writeContractAsync, isPending, isMining } = useScaffoldWriteContract({
    contractName: "TokenpingPaywall",
    chainId,
  });

  const isOwner = useMemo(() => {
    if (!owner || !connectedAddress) return false;
    return owner.toLowerCase() === connectedAddress.toLowerCase();
  }, [owner, connectedAddress]);

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

  const executeAdminTx = async (callback: () => Promise<unknown>) => {
    setTxError("");
    try {
      await callback();
      await refetchAll();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Transaction failed";
      setTxError(message);
    }
  };

  const handlePause = async () => {
    await executeAdminTx(async () => {
      await writeContractAsync({
        functionName: "pause",
      });
    });
  };

  const handleUnpause = async () => {
    await executeAdminTx(async () => {
      await writeContractAsync({
        functionName: "unpause",
      });
    });
  };

  const handleSetPlan = async () => {
    if (!normalizedPlanToken) {
      setTxError("Enter a valid token address for plan update");
      return;
    }
    if (!planPrice || !planDurationSeconds) {
      setTxError("Enter plan price and duration");
      return;
    }
    const decimals = Number(planTokenDecimals ?? 6);
    let parsedPrice: bigint;
    let parsedDuration: bigint;
    try {
      parsedPrice = parseUnits(planPrice, decimals);
      parsedDuration = BigInt(planDurationSeconds);
    } catch {
      setTxError("Invalid plan values");
      return;
    }

    await executeAdminTx(async () => {
      await writeContractAsync({
        functionName: "setPlan",
        args: [normalizedPlanToken, parsedPrice, parsedDuration, planEnabled],
      });
    });
  };

  const handleSetMaxDuration = async () => {
    if (!maxDurationSeconds) {
      setTxError("Enter max duration in seconds");
      return;
    }
    let parsedDuration: bigint;
    try {
      parsedDuration = BigInt(maxDurationSeconds);
    } catch {
      setTxError("Invalid max duration");
      return;
    }

    await executeAdminTx(async () => {
      await writeContractAsync({
        functionName: "setMaxDurationSeconds",
        args: [parsedDuration],
      });
    });
  };

  const handleWithdrawNative = async () => {
    if (!isAddress(withdrawNativeTo)) {
      setTxError("Enter a valid destination address for native withdraw");
      return;
    }
    if (!withdrawNativeAmountEth) {
      setTxError("Enter native amount in ETH");
      return;
    }
    let amount: bigint;
    try {
      amount = parseEther(withdrawNativeAmountEth);
    } catch {
      setTxError("Invalid ETH amount");
      return;
    }

    await executeAdminTx(async () => {
      await writeContractAsync({
        functionName: "withdrawNative",
        args: [withdrawNativeTo as `0x${string}`, amount],
      });
    });
  };

  const handleWithdrawToken = async () => {
    if (!normalizedWithdrawToken) {
      setTxError("Enter a valid token address");
      return;
    }
    if (!isAddress(withdrawTokenTo)) {
      setTxError("Enter a valid destination address for token withdraw");
      return;
    }
    if (!withdrawTokenAmount) {
      setTxError("Enter token amount");
      return;
    }

    const decimals = Number(withdrawTokenDecimals ?? 6);
    let amount: bigint;
    try {
      amount = parseUnits(withdrawTokenAmount, decimals);
    } catch {
      setTxError("Invalid token amount");
      return;
    }

    await executeAdminTx(async () => {
      await writeContractAsync({
        functionName: "withdrawTokens",
        args: [normalizedWithdrawToken, withdrawTokenTo as `0x${string}`, amount],
      });
    });
  };

  const handleTransferOwnership = async () => {
    if (!isAddress(newOwnerAddress)) {
      setTxError("Enter a valid new owner address");
      return;
    }
    await executeAdminTx(async () => {
      await writeContractAsync({
        functionName: "transferOwnership",
        args: [newOwnerAddress as `0x${string}`],
      });
    });
  };

  if (!paymentChainId || !paymentContractAddress) {
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
        <div className="rounded-3xl border border-base-300 bg-base-100 dark:border-white/10 dark:bg-gray-900/60 p-6">
          <h1 className="text-2xl md:text-3xl font-bold">Admin Console</h1>
          <p className="text-sm text-base-content/70 mt-2">
            Private operational dashboard for `TokenpingPaywall`. This page is intentionally not linked in navigation.
          </p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-base-200 dark:bg-base-300/10 p-3">
              <div className="font-semibold mb-1">Contract</div>
              <Address address={paymentContractAddress as `0x${string}`} />
            </div>
            <div className="rounded-xl bg-base-200 dark:bg-base-300/10 p-3">
              <div className="font-semibold mb-1">Owner</div>
              {owner ? <Address address={owner} /> : <span className="text-base-content/70">Loading owner...</span>}
            </div>
            <div className="rounded-xl bg-base-200 dark:bg-base-300/10 p-3">
              <div className="font-semibold mb-1">Chain ID</div>
              <span>{paymentChainId}</span>
            </div>
            <div className="rounded-xl bg-base-200 dark:bg-base-300/10 p-3">
              <div className="font-semibold mb-1">Paused</div>
              <span>{paused ? "Yes" : "No"}</span>
            </div>
          </div>
        </div>

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
            <div className="card bg-base-100 border border-base-300 dark:border-white/10 shadow-sm">
              <div className="card-body">
                <h2 className="card-title">Pause control</h2>
                <p className="text-sm text-base-content/70">Emergency switch for paywall payments.</p>
                <div className="flex gap-3 pt-2">
                  <button className="btn btn-warning" onClick={handlePause} disabled={isBusy || Boolean(paused)}>
                    Pause
                  </button>
                  <button className="btn btn-success" onClick={handleUnpause} disabled={isBusy || !paused}>
                    Unpause
                  </button>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 border border-base-300 dark:border-white/10 shadow-sm">
              <div className="card-body">
                <h2 className="card-title">Max duration</h2>
                <p className="text-sm text-base-content/70">
                  Current: {typeof maxDuration === "bigint" ? maxDuration.toString() : "0"} seconds
                </p>
                <input
                  className="input input-bordered w-full"
                  placeholder="New max duration (seconds)"
                  value={maxDurationSeconds}
                  onChange={event => setMaxDurationSeconds(event.target.value)}
                />
                <button className="btn btn-primary w-fit" onClick={handleSetMaxDuration} disabled={isBusy}>
                  Update max duration
                </button>
              </div>
            </div>

            <div className="card bg-base-100 border border-base-300 dark:border-white/10 shadow-sm">
              <div className="card-body">
                <h2 className="card-title">Update plan</h2>
                <p className="text-sm text-base-content/70">Set token plan price, duration, and enable status.</p>
                <input
                  className="input input-bordered w-full"
                  placeholder="Token address"
                  value={planTokenAddress}
                  onChange={event => setPlanTokenAddress(event.target.value)}
                />
                <input
                  className="input input-bordered w-full"
                  placeholder={`Price (${planTokenSymbol ?? "token"})`}
                  value={planPrice}
                  onChange={event => setPlanPrice(event.target.value)}
                />
                <input
                  className="input input-bordered w-full"
                  placeholder="Duration seconds"
                  value={planDurationSeconds}
                  onChange={event => setPlanDurationSeconds(event.target.value)}
                />
                <label className="label cursor-pointer justify-start gap-3">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary"
                    checked={planEnabled}
                    onChange={event => setPlanEnabled(event.target.checked)}
                  />
                  <span className="label-text">Plan enabled</span>
                </label>
                <div className="text-xs text-base-content/70">
                  Detected decimals: {typeof planTokenDecimals === "number" ? planTokenDecimals : "6 (fallback)"}
                </div>
                {Array.isArray(currentPlan) && currentPlan.length >= 3 ? (
                  <div className="rounded-xl bg-base-200 dark:bg-base-300/10 p-3 text-xs">
                    <div>
                      Current price:{" "}
                      {typeof currentPlan[0] === "bigint"
                        ? formatUnits(currentPlan[0], Number(planTokenDecimals ?? 6))
                        : "0"}{" "}
                      {planTokenSymbol ?? ""}
                    </div>
                    <div>
                      Current duration: {typeof currentPlan[1] === "bigint" ? currentPlan[1].toString() : "0"} sec
                    </div>
                    <div>Current enabled: {Boolean(currentPlan[2]) ? "Yes" : "No"}</div>
                  </div>
                ) : null}
                <button className="btn btn-primary w-fit" onClick={handleSetPlan} disabled={isBusy}>
                  Save plan
                </button>
              </div>
            </div>

            <div className="card bg-base-100 border border-base-300 dark:border-white/10 shadow-sm">
              <div className="card-body">
                <h2 className="card-title">Withdraw native</h2>
                <p className="text-sm text-base-content/70">
                  Contract native balance: {nativeBalance ? formatEther(nativeBalance.value) : "0"} ETH
                </p>
                <input
                  className="input input-bordered w-full"
                  placeholder="Destination address"
                  value={withdrawNativeTo}
                  onChange={event => setWithdrawNativeTo(event.target.value)}
                />
                <input
                  className="input input-bordered w-full"
                  placeholder="Amount in ETH"
                  value={withdrawNativeAmountEth}
                  onChange={event => setWithdrawNativeAmountEth(event.target.value)}
                />
                <button className="btn btn-primary w-fit" onClick={handleWithdrawNative} disabled={isBusy}>
                  Withdraw native
                </button>
              </div>
            </div>

            <div className="card bg-base-100 border border-base-300 dark:border-white/10 shadow-sm">
              <div className="card-body">
                <h2 className="card-title">Withdraw token</h2>
                <p className="text-sm text-base-content/70">
                  Contract token balance:{" "}
                  {typeof contractTokenBalance === "bigint"
                    ? formatUnits(contractTokenBalance, Number(withdrawTokenDecimals ?? 6))
                    : "0"}{" "}
                  {withdrawTokenSymbol ?? ""}
                </p>
                <input
                  className="input input-bordered w-full"
                  placeholder="Token address"
                  value={withdrawTokenAddress}
                  onChange={event => setWithdrawTokenAddress(event.target.value)}
                />
                <input
                  className="input input-bordered w-full"
                  placeholder="Destination address"
                  value={withdrawTokenTo}
                  onChange={event => setWithdrawTokenTo(event.target.value)}
                />
                <input
                  className="input input-bordered w-full"
                  placeholder={`Amount (${withdrawTokenSymbol ?? "token"})`}
                  value={withdrawTokenAmount}
                  onChange={event => setWithdrawTokenAmount(event.target.value)}
                />
                <button className="btn btn-primary w-fit" onClick={handleWithdrawToken} disabled={isBusy}>
                  Withdraw token
                </button>
              </div>
            </div>

            <div className="card bg-base-100 border border-base-300 dark:border-white/10 shadow-sm xl:col-span-2">
              <div className="card-body">
                <h2 className="card-title">Transfer ownership</h2>
                <p className="text-sm text-base-content/70">Move contract admin rights to another wallet.</p>
                <input
                  className="input input-bordered w-full md:max-w-xl"
                  placeholder="New owner address"
                  value={newOwnerAddress}
                  onChange={event => setNewOwnerAddress(event.target.value)}
                />
                <button className="btn btn-error w-fit" onClick={handleTransferOwnership} disabled={isBusy}>
                  Transfer ownership
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default AdminPage;
