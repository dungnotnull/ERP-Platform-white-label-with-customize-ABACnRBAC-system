import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  maxCharacters?: number;
  maxRows?: number;
  showCharacterCount?: boolean;
  averageCharsPerRow?: number;
  autoLimitByRows?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      maxCharacters,
      maxRows = Infinity,
      showCharacterCount = false,
      averageCharsPerRow = 70,
      autoLimitByRows = false,
      onChange,
      ...props
    },
    ref
  ) => {
    const [characterCount, setCharacterCount] = React.useState(0);
    const [effectiveMaxChars, setEffectiveMaxChars] =
      React.useState(maxCharacters);
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const combinedRef = useCombinedRefs(ref, textareaRef);

    React.useEffect(() => {
      if (autoLimitByRows && maxRows < Infinity) {
        const calculatedLimit = maxRows * averageCharsPerRow;

        setEffectiveMaxChars(
          maxCharacters
            ? Math.min(maxCharacters, calculatedLimit)
            : calculatedLimit
        );
      } else {
        setEffectiveMaxChars(maxCharacters);
      }
    }, [maxRows, maxCharacters, averageCharsPerRow, autoLimitByRows]);

    const calculateMetrics = (text: string) => {
      const lines = text.split("\n");

      if (textareaRef.current) {
        const computedStyle = window.getComputedStyle(textareaRef.current);
        const width =
          parseInt(computedStyle.width, 10) -
          parseInt(computedStyle.paddingLeft, 10) -
          parseInt(computedStyle.paddingRight, 10);

        const charWidth = parseInt(computedStyle.fontSize, 10) * 0.6;

        if (!isNaN(width) && !isNaN(charWidth) && charWidth > 0) {
          const charsPerLine = Math.floor(width / charWidth);

          let totalLines = 0;
          for (const line of lines) {
            totalLines += Math.max(1, Math.ceil(line.length / charsPerLine));
          }

          if (autoLimitByRows && maxRows < Infinity && totalLines > maxRows) {
            const newLimit = Math.floor(text.length * (maxRows / totalLines));
            setEffectiveMaxChars(
              maxCharacters ? Math.min(maxCharacters, newLimit) : newLimit
            );
          }
        }
      }

      return text.length;
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      let value = e.target.value;

      if (maxRows < Infinity) {
        const lines = value.split("\n");
        if (lines.length > maxRows) {
          value = lines.slice(0, maxRows).join("\n");
          e.target.value = value;
        }
      }

      if (effectiveMaxChars && value.length > effectiveMaxChars) {
        value = value.slice(0, effectiveMaxChars);
        e.target.value = value;
      }

      const count = calculateMetrics(value);
      setCharacterCount(count);

      if (onChange) {
        onChange(e);
      }
    };

    React.useEffect(() => {
      if (textareaRef.current) {
        const count = calculateMetrics(textareaRef.current.value);
        setCharacterCount(count);
      }
    }, []);

    return (
      <div className="relative">
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-sm bg-input px-3 py-2 text-sm placeholder:text-placeholder border border-input focus-visible:outline-0 focus-visible:bg-background focus-visible:border-black disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={combinedRef}
          onChange={handleChange}
          {...props}
        />
        {showCharacterCount && (
          <div className="text-xs text-muted-foreground absolute bottom-2 right-2">
            {characterCount}
            {effectiveMaxChars ? ` / ${effectiveMaxChars}` : ""}
          </div>
        )}
      </div>
    );
  }
);

function useCombinedRefs<T>(
  ...refs: Array<React.Ref<T> | undefined>
): React.RefCallback<T> {
  return React.useCallback(
    (element: T) => {
      refs.forEach(ref => {
        if (!ref) return;

        if (typeof ref === "function") {
          ref(element);
        } else {
          (ref as React.MutableRefObject<T>).current = element;
        }
      });
    },
    [refs]
  );
}

Textarea.displayName = "Textarea";

export { Textarea };
