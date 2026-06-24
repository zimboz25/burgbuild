import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Markets",
};

export default function StocksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-stocks-panel flex min-h-full flex-1 flex-col">
      {children}
    </div>
  );
}
