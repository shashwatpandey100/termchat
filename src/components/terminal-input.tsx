"use client";

import { useRef, useEffect } from "react";

export function TerminalInput({
  value,
  onChange,
  onSubmit,
  prompt,
  promptClassName,
  disabled,
  autoFocus,
  type = "text",
  maxLength,
  inputRef,
}: {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  prompt: string;
  promptClassName?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  type?: "text" | "password";
  maxLength?: number;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}) {
  const localRef = useRef<HTMLInputElement>(null);
  const ref = inputRef || localRef;

  // Auto-focus on mount when autoFocus is set
  useEffect(() => {
    if (autoFocus && !disabled) {
      ref.current?.focus();
    }
  }, [autoFocus, disabled, ref]);

  return (
    <div className="flex items-center cursor-text" onClick={() => ref.current?.focus()}>
      <span className={promptClassName || "text-gray-200 text-sm"}>
        {prompt}
      </span>
      <span className="text-gray-200 text-sm">
        {type === "password" ? "\u2022".repeat(value.length) : value}
      </span>
      {/* Cursor: always blinks when active */}
      <span
        className={`inline-block w-[0.5em] h-[1.1em] bg-white/70 ml-[2px] ${
          disabled ? "opacity-0" : "cursor-blink"
        }`}
      />
      <input
        ref={ref}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => {
          // Terminal inputs stay focused — refocus unless another input/link took over
          const related = e.relatedTarget as HTMLElement | null;
          if (
            related?.tagName === "INPUT" ||
            related?.tagName === "BUTTON" ||
            related?.tagName === "A" ||
            related?.tagName === "VIDEO"
          ) {
            return;
          }
          setTimeout(() => {
            if (!disabled && ref.current) ref.current.focus();
          }, 0);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onSubmit();
          }
        }}
        autoFocus={autoFocus}
        disabled={disabled}
        maxLength={maxLength}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        data-form-type="other"
        className="absolute opacity-0 w-0 h-0"
        tabIndex={-1}
      />
    </div>
  );
}
