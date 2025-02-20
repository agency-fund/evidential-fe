'use client';

import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Container, Flex, Theme } from '@radix-ui/themes';
import { OrganizationProvider } from './organization-provider';
import '@radix-ui/themes/styles.css';
import GoogleAuthProvider from '@/app/auth-provider';
import OurSwrConfig from '@/services/our-swr-config';
import { Suspense } from 'react';
import { NavigationBar } from '@/app/navigation-bar';
import { HeaderBar } from '@/app/header-bar';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
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
                <OrganizationProvider>
                  <Flex direction="column" minHeight={'100vh'}>
                    <HeaderBar />
                    <Flex>
                      <NavigationBar />
                      <Container p={'16px'} minWidth={'65vw'}>
                        <Suspense>{children}</Suspense>
                      </Container>
                    </Flex>
                  </Flex>
                </OrganizationProvider>
              </OurSwrConfig>
            </GoogleAuthProvider>
          </Suspense>
        </Theme>
      </body>
    </html>
  );
}
