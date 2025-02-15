"use client";
import {Box, Flex, Heading, Separator} from "@radix-ui/themes";
import Link from "next/link";
import {useAuth} from "@/app/auth-provider";
import {usePathname} from "next/navigation";

export const NavigationBar = () => {
    const {isAuthenticated} = useAuth();
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    if (!isAuthenticated) return null;

    return (
        <Flex
            direction="column"
            gap="3"
            width="200px"
            height="100vh"
            p="4"
            style={{borderRight: '1px solid var(--gray-5)'}}
        >
            <Heading size="4">Navigation</Heading>
            <Separator size="4"/>
            <Flex direction="column" gap="2">
                <Link href="/">
                    <Box p="2" style={{
                        borderRadius: 'var(--radius-2)',
                        backgroundColor: isActive('/') ? 'var(--gray-3)' : 'transparent'
                    }}>
                        Dashboard
                    </Box>
                </Link>
                <Link href="/organizations">
                    <Box p="2" style={{
                        borderRadius: 'var(--radius-2)',
                        backgroundColor: isActive('/organizations') ? 'var(--gray-3)' : 'transparent'
                    }}>
                        Organizations
                    </Box>
                </Link>
            </Flex>
        </Flex>
    );
};
