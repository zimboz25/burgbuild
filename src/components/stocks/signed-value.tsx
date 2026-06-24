import type { ReactNode } from "react";
import { signedValueClass, signedValueStyle } from "@/lib/stocks/value-colors";

export function SignedValue({
  value,
  children,
  className = "",
}: {
  value: number | null | undefined;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`${signedValueClass(value)} ${className}`.trim()}
      style={signedValueStyle(value)}
    >
      {children}
    </span>
  );
}
