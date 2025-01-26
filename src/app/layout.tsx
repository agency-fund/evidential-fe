"use client";

import {Geist, Geist_Mono} from "next/font/google";
import "./globals.css";
import {Container, Flex, Heading, Separator, Theme} from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import GoogleAuthProvider from "@/app/auth-provider";
import OurSwrConfig from "@/services/our-swr-config";
import Link from "next/link";
import {Suspense} from "react";

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
    return (
        <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Theme>
            <Suspense>
                <GoogleAuthProvider>
                    <OurSwrConfig>
                        <Container>
                            <Flex direction="column" gap={"3"}>
                                <Heading asChild><Link href={"/"}>xngin admin</Link></Heading>
                                <Separator/>
                                <Suspense>
                                    {children}
                                </Suspense>
                            </Flex>
                        </Container>
                    </OurSwrConfig>
                </GoogleAuthProvider>
            </Suspense>
        </Theme>
        </body>
        </html>
    );
}
