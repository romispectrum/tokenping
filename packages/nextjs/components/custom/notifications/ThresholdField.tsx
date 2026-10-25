import { type KeyboardEvent, useId, useRef } from "react";
import { Input } from "~~/components/ui";
import { useLocale } from "~~/i18n/LocaleProvider";
import { type MarketNameKind, formatDecimal } from "~~/i18n/format";
import { ALERTS_MESSAGES } from "~~/i18n/messages/alerts";
import {
  AAVE_THRESHOLD_RANGE,
  THRESHOLD_INPUT_PATTERN,
  type ThresholdRange,
  clampSliderThreshold,
  formatThreshold,
  parseThresholdInput,
} from "~~/utils/notifications/threshold";

type ThresholdFieldProps = {
  threshold: number;
  thresholdText: string;
  chainName: string;
  /** What `chainName` names, for Czech grammar; read from an Aave label when left out. */
  chainNameKind?: MarketNameKind;
  onThresholdChange: (threshold: number) => void;
  onThresholdTextChange: (thresholdText: string) => void;
  /** The protocol's thresholds and slider; Aave's when left out. */
  range?: ThresholdRange;
};

/** Where each of the three marks under the slider sits: its two ends and the middle. */
const SCALE_ALIGN = ["items-start text-left", "items-center text-center", "items-end text-right"] as const;

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
  chainNameKind,
  onThresholdChange,
  onThresholdTextChange,
  range = AAVE_THRESHOLD_RANGE,
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
    const next = clampSliderThreshold(parseFloat(value), range);
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
    const parsed = parseThresholdInput(nextRaw, range);
    if (parsed !== null) onThresholdChange(parsed);
  };

  const handleTextBlur = () => {
    const parsed = parseThresholdInput(thresholdText, range);
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
        {/* The slider stops at the top of its range (3 for Aave, 2 for Morpho) and the threshold does not, so the value
            text carries the threshold that applies.
            No fill: DaisyUI paints it as a full-height bar, which would make the dark theme's cyan a large fill.
            The thumb ring is --link (never pink) on the --input track. On touch screens the input box, which is
            the hit area, grows to 44px while the track and thumb keep their size. */}
        <input
          id={sliderId}
          type="range"
          min={range.sliderMin}
          max={range.sliderMax.toFixed(1)}
          step={range.sliderStep}
          value={clampSliderThreshold(threshold, range)}
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
        {range.scale.map(({ value, mark }, index) => (
          <span key={value} className={`flex flex-col ${SCALE_ALIGN[index]}`}>
            <span>{formatDecimal(locale, value)}</span>
            <span>{t.thresholdScale[mark]}</span>
          </span>
        ))}
      </div>
      <p id={descriptionId} className="m-0 text-sm text-muted-foreground">
        {t.thresholdDescription(formatDecimal(locale, threshold), chainName, chainNameKind)}
      </p>
    </div>
  );
};
