'use client';
import '@radix-ui/themes/styles.css';

import { Geist, Geist_Mono } from 'next/font/google';
import { Container, Flex, Theme } from '@radix-ui/themes';
import { OrganizationProvider } from '@/providers/organization-provider';
import GoogleAuthProvider from '@/providers/auth-provider';
import OurSwrConfig from '@/providers/our-swr-config';
import { Suspense } from 'react';
import { NavigationBarNoCompact } from '@/components/layout/nav/navigation-curtain-no-compact';
import { HeaderBar } from '@/components/layout/header/header-bar';
import RequireLogin from '@/components/require-login';

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
      <body className={`${geistSans.variable} ${geistMono.variable}`} style={{ margin: 0, padding: 0 }}>
        <Theme appearance="light" accentColor="indigo" grayColor="slate" radius="large">
          <Suspense>
            <GoogleAuthProvider>
              <OurSwrConfig>
                <RequireLogin>
                  <OrganizationProvider>
                    <Flex direction="column" height="100vh">
                      <HeaderBar />
                      <Flex flexGrow="1" overflow="hidden">
                        {/*Temporary always open navigation curtain to experiments and settings nav links are always visible, please do not remove*/}
                        <NavigationBarNoCompact />
                        <Flex direction="column" flexGrow="1" overflowY="auto" position="relative">
                          <Container
                            py="8"
                            px="4"
                            flexGrow="1"
                            width="100%"
                            style={{ backgroundColor: 'var(--gray-2)', borderLeft: '1px solid var(--gray-4)' }}
                          >
                            <Suspense>{children}</Suspense>
                          </Container>
                        </Flex>
                      </Flex>
                    </Flex>
                  </OrganizationProvider>
                </RequireLogin>
              </OurSwrConfig>
            </GoogleAuthProvider>
          </Suspense>
        </Theme>
      </body>
    </html>
  );
}
