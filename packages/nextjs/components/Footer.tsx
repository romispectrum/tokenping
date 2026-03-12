import React from "react";
import Link from "next/link";
import { useFetchNativeCurrencyPrice } from "@scaffold-ui/hooks";
import { hardhat } from "viem/chains";
import { CurrencyDollarIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { SwitchTheme } from "~~/components/SwitchTheme";
import { Faucet } from "~~/components/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";

/**
 * Site footer
 */
export const Footer = () => {
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;
  const { price: nativeCurrencyPrice } = useFetchNativeCurrencyPrice();

  return (
    <div className="min-h-0 py-5 px-1 mb-11 lg:mb-0">
      <div>
        <div className="fixed flex justify-between items-center w-full z-10 p-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] bottom-0 left-0 pointer-events-none safe-area-inset-left safe-area-inset-right">
          <div className="flex flex-col sm:flex-row gap-2 pointer-events-auto">
            {nativeCurrencyPrice > 0 && (
              <div>
                <div className="btn btn-primary btn-sm font-normal gap-1 cursor-auto touch-target-min min-h-9">
                  <CurrencyDollarIcon className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="truncate">{nativeCurrencyPrice.toFixed(2)}</span>
                </div>
              </div>
            )}
            {isLocalNetwork && (
              <>
                <Faucet />
                <Link
                  href="/blockexplorer"
                  passHref
                  className="btn btn-primary btn-sm font-normal gap-1 touch-target-min min-h-9"
                >
                  <MagnifyingGlassIcon className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="hidden sm:inline">Block Explorer</span>
                  <span className="sm:hidden">Explorer</span>
                </Link>
              </>
            )}
          </div>
          <SwitchTheme className={`pointer-events-auto ${isLocalNetwork ? "self-end md:self-auto" : ""}`} />
        </div>
      </div>
      <div className="w-full">
        <ul className="menu menu-horizontal w-full">
          <div className="flex justify-center items-center gap-4 text-sm w-full">
            <a
              href="https://t.me/tokenping_xyz"
              target="_blank"
              rel="noreferrer"
              className="link"
              aria-label="Tokenping Telegram Community"
            >
              Telegram
            </a>
            <a
              href="https://x.com/tokenping"
              target="_blank"
              rel="noreferrer"
              className="link"
              aria-label="Tokenping on X"
            >
              X
            </a>
          </div>
        </ul>
      </div>
    </div>
  );
};
