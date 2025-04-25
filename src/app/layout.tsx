// app/layout.tsx (or appropriate path)
'use client';
import '@radix-ui/themes/styles.css';

import { Geist, Geist_Mono } from 'next/font/google';
import { Container, Flex, Theme } from '@radix-ui/themes';
import { OrganizationProvider } from './providers/organization-provider';

import GoogleAuthProvider from '@/app/providers/auth-provider';
import OurSwrConfig from '@/app/providers/our-swr-config';
import { Suspense } from 'react';
// Assuming NavigationBar is now at '@/app/components/navigation/NavigationBar'
import { NavigationBar } from '@/app/components/nav/navigation-curtain';
// Assuming HeaderBar is now at '@/app/components/header/HeaderBar'
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
                    {/* Overall Page Layout: Header fixed at top, content area below */}
                    <Flex direction="column" style={{ height: '100vh' }}>
                      {/* Header Bar remains at the top */}
                      <HeaderBar />

                      {/* Main Content Area: Navigation and Children side-by-side */}
                      {/* This Flex container holds the Nav and the main content */}
                      <Flex flexGrow="1" style={{ overflow: 'hidden' }}>
                        {/* NavigationBar is now a direct child here */}
                        {/* It will naturally take space on the left */}
                        <NavigationBar />

                        {/* Main Scrollable Content Area */}
                        <Flex
                          direction="column" // Stack content vertically if needed
                          flexGrow="1"
                          style={{
                            overflowY: 'auto', // Allow only vertical scrolling for content
                            position: 'relative', // Establish stacking context if needed for children
                          }}
                        >
                          {/* Container for padding */}
                          {/* Removed pb='4' from outer Flex, handled by Container or content */}
                          <Container p="4" style={{ flexGrow: 1, width: '100%' }}>
                            <Suspense>{children}</Suspense>
                          </Container>
                        </Flex>
                      </Flex>
                    </Flex>

                    {/* Toast Viewport remains fixed */}
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
