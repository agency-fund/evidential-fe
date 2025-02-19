"use client";
import {Button, Flex, Heading} from "@radix-ui/themes";
import Link from "next/link";
import {useAuth} from "@/app/auth-provider";
import {ExitIcon} from "@radix-ui/react-icons";

export const HeaderBar = () => {
    const auth = useAuth();

    if (!auth.isAuthenticated) return null;

    return (
        <Flex
            justify="between"
            align="center"
            style={{
                borderBottom: '1px solid var(--gray-5)',
                padding: '16px',
                position: 'sticky',
                top: 0,
                backgroundColor: 'var(--color-page-background)',
                zIndex: 10
            }}
        >
            <Link href="/">
                <Heading>xngin admin</Heading>
            </Link>
            <Button variant="soft" onClick={auth.logout}>
                <ExitIcon/> Logout
            </Button>
        </Flex>
    );
};
