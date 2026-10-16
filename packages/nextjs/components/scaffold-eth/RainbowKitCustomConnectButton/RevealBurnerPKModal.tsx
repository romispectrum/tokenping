import { useRef } from "react";
import { rainbowkitBurnerWallet } from "burner-connector";
import { ShieldExclamationIcon } from "@heroicons/react/24/outline";
import { useCopyToClipboard } from "~~/hooks/scaffold-eth";
import { useMessages } from "~~/i18n/LocaleProvider";
import { COMMON_MESSAGES } from "~~/i18n/messages/common";
import { getParsedError, notification } from "~~/utils/scaffold-eth";

const BURNER_WALLET_PK_KEY = "burnerWallet.pk";

export const RevealBurnerPKModal = () => {
  const { copyToClipboard, isCopiedToClipboard } = useCopyToClipboard();
  const modalCheckboxRef = useRef<HTMLInputElement>(null);
  const t = useMessages(COMMON_MESSAGES).wallet.burner;

  const handleCopyPK = async () => {
    try {
      const storage = rainbowkitBurnerWallet.useSessionStorage ? sessionStorage : localStorage;
      const burnerPK = storage?.getItem(BURNER_WALLET_PK_KEY);
      if (!burnerPK) throw new Error(t.notFound);
      await copyToClipboard(burnerPK);
      notification.success(t.copied);
    } catch (e) {
      const parsedError = getParsedError(e);
      notification.error(parsedError);
      if (modalCheckboxRef.current) modalCheckboxRef.current.checked = false;
    }
  };

  return (
    <>
      <div>
        <input type="checkbox" id="reveal-burner-pk-modal" className="modal-toggle" ref={modalCheckboxRef} />
        <label htmlFor="reveal-burner-pk-modal" className="modal cursor-pointer">
          <label className="modal-box relative">
            {/* dummy input to capture event onclick on modal box */}
            <input className="h-0 w-0 absolute top-0 left-0" />
            <label htmlFor="reveal-burner-pk-modal" className="btn btn-ghost btn-sm btn-circle absolute right-3 top-3">
              ✕
            </label>
            <div>
              <p className="text-lg font-semibold m-0 p-0">{t.title}</p>
              <div role="alert" className="alert alert-warning mt-4">
                <ShieldExclamationIcon className="h-6 w-6" />
                <span className="font-semibold">{t.warning}</span>
              </div>
              <p>
                {t.accessBefore}
                <strong>{t.accessStrong}</strong>
                {t.accessMiddle}
                <strong>{t.temporaryStrong}</strong>
                {t.accessAfter}
              </p>
              <button className="btn btn-outline btn-error" onClick={handleCopyPK} disabled={isCopiedToClipboard}>
                {t.copy}
              </button>
            </div>
          </label>
        </label>
      </div>
    </>
  );
};
