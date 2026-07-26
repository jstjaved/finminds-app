import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FinMinds — Learn, Earn, Invest",
  description: "A financial literacy app for school students: learn a lesson, earn coins, invest in a safe simulator.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex items-center justify-center p-0 sm:p-5">
          <div className="w-full sm:w-[430px] min-h-screen sm:min-h-[820px] sm:rounded-[40px] sm:shadow-2xl overflow-hidden bg-cloud relative">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
