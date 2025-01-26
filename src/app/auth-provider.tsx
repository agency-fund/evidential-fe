"use client";

import {createContext, PropsWithChildren, useContext, useEffect, useState} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import {exchangeCodeForTokens, generatePkceLoginInfo} from "@/services/pkce";
import {Spinner} from "@radix-ui/themes";
import {useIdTokenStorage} from "@/services/use-id-token-storage";


interface AuthContext {
    idToken: string | null
    isAuthenticated: boolean
    startLogin: () => void
    logout: () => void
}

const GoogleAuthContext = createContext<AuthContext | null>(null);

export const useAuth = () => {
    const context = useContext(GoogleAuthContext);
    if (context === null) {
        throw new Error("useAuth can only be used within GoogleAuthProvider");
    }
    return context;
}

export default function GoogleAuthProvider({children}: PropsWithChildren) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [idToken, setIdToken] = useIdTokenStorage();
    const [fetching, setFetching] = useState<boolean>(false);
    const isGoogleLoginRedirect = (idToken === null && searchParams.has("code") && searchParams.has("scope"));

    useEffect(() => {
        if (!isGoogleLoginRedirect) {
            return;
        }
        (async () => {
            setFetching(true);
            try {
                const codeVerifier = localStorage.getItem("code_verifier");
                const tokens = await exchangeCodeForTokens(searchParams.get("code") as string, codeVerifier!);
                localStorage.removeItem("code_verifier");
                setIdToken(tokens.id_token ?? null);
                router.push("/");
            } finally {
                setFetching(false);
            }
        })();
    }, [router, searchParams, setIdToken, isGoogleLoginRedirect])

    const logout = async () => {
        console.log("logout");
        localStorage.removeItem("code_verifier");
        setIdToken(null);
        router.push("/");
    }

    const startLogin = async () => {
        const {codeVerifier, loginUrl} = await generatePkceLoginInfo();
        localStorage.setItem("code_verifier", codeVerifier);
        router.push(loginUrl);
    };

    const contextValue: AuthContext = {
        idToken,
        isAuthenticated: idToken !== null,
        startLogin,
        logout
    }

    return fetching ? <Spinner/> :
        <GoogleAuthContext.Provider value={contextValue}>{children}</GoogleAuthContext.Provider>;
}
