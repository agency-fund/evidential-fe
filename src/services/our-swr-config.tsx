import {PropsWithChildren} from "react";
import {SWRConfig} from "swr";
import {fetchWithToken} from "@/services/fetcher";
import {useAuth} from "@/app/auth-provider";


export default function OurSwrConfig({children}: PropsWithChildren) {
    const {idToken, logout} = useAuth();

    return <SWRConfig value={{
        // @ts-expect-error todo
        fetcher: (...args) => fetchWithToken(idToken, ...args),
        onError: (error, key, config) => {
            console.log("Intercepted API error:", {error, key, config});
            if (error.status == 401) {
                console.log("Unauthorized; calling logout.");
                logout();
            }
        }
    }}>
        {children}
    </SWRConfig>;


}
