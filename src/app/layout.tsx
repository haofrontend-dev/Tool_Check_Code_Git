import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Git Code Checker",
    description: "Track and export code changes efficiently",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark" suppressHydrationWarning>
            <body className={`${inter.className} bg-slate-950 text-slate-50 min-h-screen antialiased`} suppressHydrationWarning>
                {children}
            </body>
        </html>
    );
}
