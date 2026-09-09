import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Startup Sphere | Prescriptive Predictive Analytics & Digital Twin",
  description: "AI-driven digital twin simulation, XGBoost calibrated survival predictions, and prescriptive runway analytics for early-stage founders.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark bg-black text-slate-100">
      <body
        className="min-h-screen bg-black text-slate-100 antialiased selection:bg-violet-500 selection:text-white"
        style={{ fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif" }}
      >
        {children}
      </body>
    </html>
  );
}
