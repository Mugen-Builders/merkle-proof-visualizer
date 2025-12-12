"use client";

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider, type Config } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { mainnet } from "wagmi/chains";
import { useEffect, useState } from "react";

const queryClient = new QueryClient();

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [config, setConfig] = useState<Config | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      import("@rainbow-me/rainbowkit").then(({ getDefaultConfig }) => {
        const loadedConfig = getDefaultConfig({
          appName: "Merkle Proof Visualizer",
          projectId: "7e8635a1436a3c3fe755a3a69323e19a",
          chains: [mainnet],
          ssr: false, // Ensure SSR is disabled
        });
        setConfig(loadedConfig);
      });
    }
  }, []);

  if (!config) {
    return (
      <html lang="en">
        <body>
          <div>Loading...</div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryClientProvider client={queryClient}>
          <WagmiProvider config={config}>
            <RainbowKitProvider>{children}</RainbowKitProvider>
          </WagmiProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
