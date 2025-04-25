'use client';
import '@radix-ui/themes/styles.css';

import { Geist, Geist_Mono } from 'next/font/google';
import { Container, Flex, Theme } from '@radix-ui/themes';
import { OrganizationProvider } from './providers/organization-provider';
import GoogleAuthProvider from '@/app/providers/auth-provider';
import OurSwrConfig from '@/app/providers/our-swr-config';
import { Suspense } from 'react';
import { NavigationBar } from '@/app/components/nav/navigation-curtain';
import { HeaderBar } from '@/app/components/header/header-bar';
import * as Toast from '@radix-ui/react-toast';

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
          <Toast.Provider swipeDirection="right">
            <Suspense>
              <GoogleAuthProvider>
                <OurSwrConfig>
                  <OrganizationProvider>
                    <Flex direction="column" style={{ height: '100vh' }}>
                      <HeaderBar />
                      <Flex flexGrow="1" style={{ overflow: 'hidden' }}>
                        <NavigationBar />
                        <Flex
                          direction="column"
                          flexGrow="1"
                          style={{
                            overflowY: 'auto',
                            position: 'relative',
                          }}
                        >
                          <Container p="4" style={{ flexGrow: 1, width: '100%' }}>
                            <Suspense>{children}</Suspense>
                          </Container>
                        </Flex>
                      </Flex>
                    </Flex>
                    <Toast.Viewport
                      style={{
                        position: 'fixed',
                        bottom: '20px',
                        right: '20px',
                        zIndex: 1000,
                        listStyle: 'none',
                        padding: 0,
                        margin: 0,
                      }}
                    />
                  </OrganizationProvider>
                </OurSwrConfig>
              </GoogleAuthProvider>
            </Suspense>
          </Toast.Provider>
        </Theme>
      </body>
    </html>
  );
}
