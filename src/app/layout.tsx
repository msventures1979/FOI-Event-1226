import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const oswald = localFont({
  variable: "--font-oswald",
  display: "swap",
  src: [
    { path: "../fonts/Oswald-Regular.ttf", weight: "400" },
    { path: "../fonts/Oswald-Regular.ttf", weight: "500" },
    { path: "../fonts/Oswald-SemiBold.ttf", weight: "600" },
    { path: "../fonts/Oswald-Bold.ttf", weight: "700" },
  ],
});

const archivo = localFont({
  variable: "--font-archivo",
  display: "swap",
  src: [
    { path: "../fonts/Archivo-Regular.ttf", weight: "400" },
    { path: "../fonts/Archivo-Medium.ttf", weight: "500" },
    { path: "../fonts/Archivo-Medium.ttf", weight: "600" },
  ],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://racing.frontlineofinnovation.de"),
  title: "FOI Racing – Die Weihnachtsfeier der anderen Art",
  description:
    "Frontline of Innovation und School of Racing: ein Nachmittag auf dem Hockenheimring, ein Abend in der Mercedes-Loge. Montag, 14. Dezember 2026. Nur auf persönliche Einladung.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "FOI Racing – Die Weihnachtsfeier der anderen Art",
    description: "Montag, 14. Dezember 2026 · Hockenheimring · auf persönliche Einladung",
    images: ["/images/hero-track.jpg"],
    locale: "de_DE",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" className={`${oswald.variable} ${archivo.variable}`}>
      <body>{children}</body>
    </html>
  );
}
