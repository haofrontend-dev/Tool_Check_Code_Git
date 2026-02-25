import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SidebarNav from "@/components/SidebarNav";
import { Suspense } from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Git Power Tools Suite",
    description: "Advanced Git Workflow GUI",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark" suppressHydrationWarning>
            <body className={`${inter.className} bg-slate-950 text-slate-200 antialiased h-screen overflow-hidden flex`}>
                <Suspense fallback={<div className="w-20 bg-slate-950/80 border-r border-slate-800/50"></div>}>
                    <SidebarNav />
                </Suspense>
                <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20 bg-[radial-gradient(circle_at_50%_-20%,#4f46e5,transparent_50%)]"></div>
                    {children}
                </main>
            </body>
        </html>
    );
}
