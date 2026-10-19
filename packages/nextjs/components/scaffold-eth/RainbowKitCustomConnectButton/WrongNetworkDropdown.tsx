import { NetworkOptions } from "./NetworkOptions";
import { useDisconnect } from "wagmi";
import { ArrowLeftOnRectangleIcon, ChevronDownIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useSignOut } from "~~/hooks/custom/useWalletSession";
import { useMessages } from "~~/i18n/LocaleProvider";
import { COMMON_MESSAGES } from "~~/i18n/messages/common";

export const WrongNetworkDropdown = () => {
  const { disconnect } = useDisconnect();
  const signOut = useSignOut();
  const t = useMessages(COMMON_MESSAGES).wallet;

  return (
    <div className="dropdown dropdown-end mr-2">
      {/* Status, not an error or the page's action: the warning tokens with an icon and the word, never pink. */}
      <label
        tabIndex={0}
        className="btn btn-sm dropdown-toggle gap-1 border-transparent bg-warning text-warning-foreground hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring pointer-coarse:min-h-11"
      >
        <ExclamationTriangleIcon aria-hidden="true" className="size-4" />
        <span>{t.wrongNetwork}</span>
        <ChevronDownIcon className="h-6 w-4 ml-2 sm:ml-0" />
      </label>
      <ul
        tabIndex={0}
        className="dropdown-content menu p-2 mt-1 shadow-center shadow-accent bg-base-200 rounded-box gap-1"
      >
        <NetworkOptions />
        <li>
          <button
            className="menu-item text-error btn-sm rounded-xl! flex gap-3 py-3"
            type="button"
            onClick={() => {
              signOut();
              disconnect();
            }}
          >
            <ArrowLeftOnRectangleIcon className="h-6 w-4 ml-2 sm:ml-0" />
            <span>{t.disconnect}</span>
          </button>
        </li>
      </ul>
    </div>
  );
};
