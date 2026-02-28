"use client";

import { useRef, useEffect, useCallback } from "react";

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

  const moveCursorToEnd = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    try {
      el.setSelectionRange(el.value.length, el.value.length);
    } catch {
      // setSelectionRange not supported on password inputs in some browsers
    }
  }, [ref]);

  // Only sync the DOM input when the parent explicitly clears it (value → "").
  // We do NOT sync on every keystroke — setting el.value from JS resets the
  // cursor to position 0 on mobile, which is the root cause of reversed typing.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (value === "" && el.value !== "") {
      el.value = "";
    }
  }, [value, ref]);

  // Auto-focus on mount
  useEffect(() => {
    if (autoFocus && !disabled) {
      ref.current?.focus();
      moveCursorToEnd();
    }
  }, [autoFocus, disabled, ref, moveCursorToEnd]);

  return (
    <div
      className="flex items-center cursor-text"
      onClick={() => {
        ref.current?.focus();
        moveCursorToEnd();
      }}
    >
      <span className={promptClassName || "text-gray-200 text-sm mr-[4px]"}>
        {prompt}
      </span>
      <span className="text-gray-200 text-sm">
        {type === "password" ? "\u2022".repeat(value.length) : value}
      </span>
      {/* Cursor blink */}
      <span
        className={`inline-block w-[0.5em] h-[1.1em] bg-white/70 ml-[2px] ${
          disabled ? "opacity-0" : "cursor-blink"
        }`}
      />
      <input
        ref={ref}
        type={type}
        // Uncontrolled — no value prop. The browser owns cursor position natively.
        // A controlled input (value={value}) causes React to call el.value = x
        // after every render, which resets the mobile cursor to 0 → reversed typing.
        defaultValue=""
        onChange={(e) => onChange(e.target.value)}
        onFocus={moveCursorToEnd}
        onBlur={(e) => {
          // On touch devices, NEVER force-refocus. The soft keyboard fires a
          // transient blur on the hidden input during every keystroke transition.
          // Our focus() + moveCursorToEnd() in a setTimeout races with the next
          // character insertion: focus() resets cursor to 0, the next key lands
          // there, producing reversed text. On mobile, users tap to focus; they
          // don't need the always-focused terminal illusion.
          if (navigator.maxTouchPoints > 0) return;

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
            if (!disabled && ref.current) {
              ref.current.focus();
              moveCursorToEnd();
            }
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
        className="absolute opacity-0 w-1 h-1 overflow-hidden"
        tabIndex={-1}
      />
    </div>
  );
}
