import React, { useId } from "react";

type TextAreaProps = Omit<React.ComponentProps<"textarea">, "children"> & {
  label?: string;
  helperText?: string;
  error?: string;
};

function joinClassNames(...classNames: Array<string | false | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

const TextArea = ({
  id,
  label,
  helperText,
  error,
  className,
  rows = 5,
  ref,
  ...props
}: TextAreaProps) => {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const descriptionId =
    error || helperText ? `${textareaId}-description` : undefined;

  return (
    <div className="w-full">
      {label ? (
        <label
          htmlFor={textareaId}
          className="mb-2 block text-sm font-medium text-slate-900"
        >
          {label}
        </label>
      ) : null}

      <textarea
        id={textareaId}
        ref={ref}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={descriptionId}
        className={joinClassNames(
          "block min-h-28 w-full resize-y rounded-md border bg-white px-3 py-2.5 text-sm text-slate-950 shadow-sm outline-none transition",
          "placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500",
          error
            ? "border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-100"
            : "border-slate-200 focus:border-[#0671FF] focus:ring-4 focus:ring-blue-100",
          className,
        )}
        {...props}
      />

      {error || helperText ? (
        <p
          id={descriptionId}
          className={joinClassNames(
            "mt-2 text-sm",
            error ? "text-red-600" : "text-slate-500",
          )}
        >
          {error ?? helperText}
        </p>
      ) : null}
    </div>
  );
};

export default TextArea;
