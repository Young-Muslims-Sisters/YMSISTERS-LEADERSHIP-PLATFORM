import type { ComponentProps, ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`screen-enter rounded-[20px] border-[1.5px] border-sage-200 bg-white p-5 shadow-card sm:p-[25.5px] ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, as: Tag = "h2" }: { children: ReactNode; as?: "h2" | "h3" }) {
  return <Tag className="text-[18px] leading-normal font-bold text-forest-950">{children}</Tag>;
}

export function Label({ htmlFor, required, children, id }: { htmlFor?: string; required?: boolean; children: ReactNode; id?: string }) {
  return (
    <label htmlFor={htmlFor} id={id} className="mb-2 block text-[14px] leading-normal font-semibold text-ink">
      {children}
      {required && (
        <>
          {" "}
          <span aria-hidden className="text-danger">*</span>
          <span className="sr-only">(required)</span>
        </>
      )}
    </label>
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-[12px] font-medium text-danger">
      {message}
    </p>
  );
}

export const inputClass =
  "h-[50px] w-full rounded-[9px] border-[1.8px] border-sage-300 bg-white px-[14px] text-base text-ink placeholder:text-muted sm:text-[13px] aria-invalid:border-danger";

type TextFieldProps = Omit<ComponentProps<"input">, "id"> & {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
};

export function TextField({ id, label, required, error, ...input }: TextFieldProps) {
  return (
    <div className="min-w-0">
      <Label htmlFor={id} required={required}>{label}</Label>
      <input
        id={id}
        name={id}
        className={inputClass}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-required={required || undefined}
        {...input}
      />
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

export function AddButton({ children, ...props }: ComponentProps<"button">) {
  return (
    <button
      type="button"
      className="inline-flex h-10 items-center rounded-lg border border-forest-600 bg-white px-4 text-[14px] font-semibold text-forest-950 transition-colors enabled:hover:bg-mint-50 disabled:opacity-50"
      {...props}
    >
      {children}
    </button>
  );
}

export function TextButton({ children, className = "", ...props }: ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={`text-[12px] font-semibold text-forest-600 underline-offset-2 hover:underline ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function SelectedChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex min-h-8 max-w-full cursor-default items-center gap-1 rounded-full bg-mint-100 pr-1.5 pl-3 text-[12px] font-semibold text-forest-950">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
        className="grid size-6 shrink-0 cursor-pointer place-items-center rounded-full text-[16px] leading-none hover:bg-white/70"
      >
        ×
      </button>
    </span>
  );
}
