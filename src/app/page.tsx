'use client';
import {Box, Button, Card, Flex, Heading, Separator, Spinner, Text} from "@radix-ui/themes";
import Link from 'next/link';
import {useAuth} from "@/app/auth-provider";
import useSWR from "swr";

const UserProfile = () => {
    const {isAuthenticated, logout} = useAuth();
    const {data, isLoading, error} = useSWR(isAuthenticated ? `m/caller-identity` : null);

    if (error) {
        return <Text>Error: {error}</Text>
    }
    if (isLoading) {
        return <Spinner/>;
    }
    return <Box maxWidth={"240px"}>
        <Card>
            <Flex gap="3" align={"center"}>
                <Box>
                    <Text as={"div"} size="2" weight={"bold"}>{data.email}.</Text>
                    <Button onClick={logout}>Log Out</Button>
                </Box>
            </Flex>

        </Card>
    </Box>

}
export default function Home() {
    const {startLogin, isAuthenticated} = useAuth();
    if (!isAuthenticated) {
        return <Flex direction="column" justify={"center"}>
            <Heading>Welcome to xngin.</Heading>
            <Text>Please log in.</Text>
            <Text><Button onClick={startLogin}>Log in</Button></Text>
        </Flex>
    }
    return (
        <Flex direction="column" gap="3">
            <Text><Link href="/datasources">Manage Datasources</Link></Text>
            <Text><Link href="/apikeys">Manage API Keys</Link></Text>
            <Separator/>
            <UserProfile/>
        </Flex>
    );
}
