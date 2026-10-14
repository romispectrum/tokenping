import { type KeyboardEvent, useRef } from "react";
import { FIELD_LABEL_CLASS } from "~~/components/custom/notifications/styles";
import { THRESHOLD_SLIDER_MAX, THRESHOLD_SLIDER_MIN, THRESHOLD_SLIDER_STEP } from "~~/constants/notifications";
import {
  THRESHOLD_INPUT_PATTERN,
  clampSliderThreshold,
  formatThreshold,
  parseThresholdInput,
} from "~~/utils/notifications/threshold";

type ThresholdFieldProps = {
  threshold: number;
  thresholdText: string;
  chainName: string;
  onThresholdChange: (threshold: number) => void;
  onThresholdTextChange: (thresholdText: string) => void;
};

// Browsers accept exponent and sign characters in some numeric inputs.
const preventExponentAndSign = (e: KeyboardEvent<HTMLInputElement>) => {
  if (e.key === "e" || e.key === "E" || e.key === "+" || e.key === "-") {
    e.preventDefault();
  }
};

/** A slider over the common range plus a free-text input over the full threshold range, kept in sync. */
export const ThresholdField = ({
  threshold,
  thresholdText,
  chainName,
  onThresholdChange,
  onThresholdTextChange,
}: ThresholdFieldProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSliderChange = (value: string) => {
    const next = clampSliderThreshold(parseFloat(value));
    onThresholdChange(next);
    // Leave the text alone while the user is typing in it.
    if (typeof document !== "undefined" && document.activeElement !== inputRef.current) {
      onThresholdTextChange(formatThreshold(next));
    }
  };

  // Allows natural typing (empty, trailing dot); the threshold only follows once the text is a complete number.
  const handleTextChange = (value: string) => {
    const nextRaw = value.replace(",", ".");
    if (!THRESHOLD_INPUT_PATTERN.test(nextRaw)) return;
    onThresholdTextChange(nextRaw);
    const parsed = parseThresholdInput(nextRaw);
    if (parsed !== null) onThresholdChange(parsed);
  };

  const handleTextBlur = () => {
    const parsed = parseThresholdInput(thresholdText);
    if (parsed === null) {
      onThresholdTextChange(formatThreshold(threshold));
      return;
    }
    onThresholdChange(parsed);
    onThresholdTextChange(formatThreshold(parsed));
  };

  return (
    <div>
      <label className={FIELD_LABEL_CLASS}>
        {/* Two text nodes on purpose: the SSR markup keeps its <!-- --> separator (pinned by the golden master). */}
        {"Health Factor Threshold:"}{" "}
        <span className="font-semibold text-base-content dark:text-white">{threshold}</span>
      </label>
      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="range"
          min={THRESHOLD_SLIDER_MIN}
          max={THRESHOLD_SLIDER_MAX.toFixed(1)}
          step={THRESHOLD_SLIDER_STEP}
          value={clampSliderThreshold(threshold)}
          onChange={e => handleSliderChange(e.target.value)}
          className="flex-1 min-w-[120px] h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
        />
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          placeholder="1.50"
          value={thresholdText}
          onChange={e => handleTextChange(e.target.value)}
          onBlur={handleTextBlur}
          onKeyDown={preventExponentAndSign}
          className="w-20 px-2 py-1.5 rounded-lg border border-base-300 bg-base-200 text-base-content text-sm dark:border-white/10 dark:bg-white/5 dark:text-white text-right tabular-nums focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30"
          aria-label="Health factor threshold (manual)"
        />
      </div>
      <div className="flex justify-between text-xs text-base-content/60 dark:text-gray-500 mt-1">
        <span>1.1 (Critical)</span>
        <span>2.0 (Safe)</span>
        <span>3.0 (Very Safe)</span>
      </div>
      <p className="text-xs text-base-content/70 dark:text-gray-400 mt-2">
        {"You'll"} be notified when your Health Factor drops below {threshold} on {chainName}.
      </p>
    </div>
  );
};
