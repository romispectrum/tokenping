import { type KeyboardEvent, useId, useRef } from "react";
import { Input } from "~~/components/ui";
import { THRESHOLD_SLIDER_MAX, THRESHOLD_SLIDER_MIN, THRESHOLD_SLIDER_STEP } from "~~/constants/notifications";
import { useLocale } from "~~/i18n/LocaleProvider";
import { formatDecimal } from "~~/i18n/format";
import { ALERTS_MESSAGES } from "~~/i18n/messages/alerts";
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

/** The marks under the slider: its two ends and the middle. */
const THRESHOLD_SCALE = [
  { value: "1.1", mark: "critical", align: "items-start text-left" },
  { value: "2.0", mark: "safe", align: "items-center text-center" },
  { value: "3.0", mark: "verySafe", align: "items-end text-right" },
] as const;

// Browsers accept exponent and sign characters in some numeric inputs.
const preventExponentAndSign = (e: KeyboardEvent<HTMLInputElement>) => {
  if (e.key === "e" || e.key === "E" || e.key === "+" || e.key === "-") {
    e.preventDefault();
  }
};

/**
 * A slider over the common range plus a free-text input over the full threshold range, kept in sync. The draft text
 * always holds a dot; on Czech pages the input shows it with a decimal comma, and either separator can be typed.
 */
export const ThresholdField = ({
  threshold,
  thresholdText,
  chainName,
  onThresholdChange,
  onThresholdTextChange,
}: ThresholdFieldProps) => {
  const locale = useLocale();
  const t = ALERTS_MESSAGES[locale];
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();
  const labelId = `${id}-label`;
  const sliderId = `${id}-slider`;
  const exactValueId = `${id}-exact`;
  const descriptionId = `${id}-description`;

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
    <div className="flex flex-col gap-2">
      <label id={labelId} htmlFor={sliderId} className="w-fit text-sm leading-snug font-medium text-foreground">
        {t.thresholdLabel}
      </label>
      <div className="flex items-center gap-3">
        {/* The slider stops at 3 and the threshold does not, so the value text carries the threshold that applies.
            No fill: DaisyUI paints it as a full-height bar, which would make the dark theme's cyan a large fill.
            The thumb ring is --link (never pink) on the --input track. On touch screens the input box, which is
            the hit area, grows to 44px while the track and thumb keep their size. */}
        <input
          id={sliderId}
          type="range"
          min={THRESHOLD_SLIDER_MIN}
          max={THRESHOLD_SLIDER_MAX.toFixed(1)}
          step={THRESHOLD_SLIDER_STEP}
          value={clampSliderThreshold(threshold)}
          aria-valuetext={formatDecimal(locale, threshold)}
          aria-describedby={descriptionId}
          onChange={e => handleSliderChange(e.target.value)}
          className="range min-w-0 flex-1 text-link [--range-bg:var(--input)] [--range-fill:0] pointer-coarse:h-11"
        />
        <div className="w-24 shrink-0">
          {/* Named by the visible label plus these words, which tell it apart from the slider. Hidden, so it is
              not read on its own; aria-labelledby still uses it. */}
          <span id={exactValueId} hidden>
            {t.thresholdExactValue}
          </span>
          <Input
            ref={inputRef}
            inputMode="decimal"
            value={formatDecimal(locale, thresholdText)}
            onChange={e => handleTextChange(e.target.value)}
            onBlur={handleTextBlur}
            onKeyDown={preventExponentAndSign}
            aria-labelledby={`${labelId} ${exactValueId}`}
            aria-describedby={descriptionId}
            className="text-right tabular-nums"
          />
        </div>
      </div>
      {/* Each mark is the value over its word, so the three fit a 320px screen at the 14px floor. */}
      <div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground">
        {THRESHOLD_SCALE.map(({ value, mark, align }) => (
          <span key={value} className={`flex flex-col ${align}`}>
            <span>{formatDecimal(locale, value)}</span>
            <span>{t.thresholdScale[mark]}</span>
          </span>
        ))}
      </div>
      <p id={descriptionId} className="m-0 text-sm text-muted-foreground">
        {t.thresholdDescription(formatDecimal(locale, threshold), chainName)}
      </p>
    </div>
  );
};
