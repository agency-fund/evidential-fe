'use client';
import '@radix-ui/themes/styles.css';

import { Geist, Geist_Mono } from 'next/font/google';
import { Container, Flex, Theme } from '@radix-ui/themes';
import { OrganizationProvider } from './providers/organization-provider';

import GoogleAuthProvider from '@/app/providers/auth-provider';
import OurSwrConfig from '@/app/providers/our-swr-config';
import { Suspense } from 'react';
import { NavigationBar } from '@/app/navigation-bar';
import { HeaderBar } from '@/app/header-bar';
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
        <Theme>
          <Toast.Provider swipeDirection="right">
            <Suspense>
              <GoogleAuthProvider>
                <OurSwrConfig>
                  <OrganizationProvider>
                    <Flex direction="column" height={'100vh'}>
                      <HeaderBar />
                      <Flex flexGrow={'1'} overflow={'hidden'} pb={'4'}>
                        <NavigationBar />
                        <Flex flexGrow={'1'} overflow={'auto'}>
                          <Container p={'4'}>
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
