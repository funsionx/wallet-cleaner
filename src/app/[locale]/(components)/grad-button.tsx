import { ReactNode } from "react";

export function GradButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white px-4 py-2 text-sm font-semibold shadow hover:opacity-90 disabled:opacity-50"
    >
      {children}
    </button>
  );
}
