import {PropsWithChildren} from "react";
import {SWRConfig} from "swr";
import {useAuth} from "@/app/auth-provider";


export default function OurSwrConfig({children}: PropsWithChildren) {
    const auth = useAuth();

    return <SWRConfig value={{
        onError: (error, key, config) => {
            console.log("Intercepted API error:", {error, key, config});
            if (error.status == 401) {
                console.log("Received 401 Unauthorized.");
                if (auth.isAuthenticated) {
                    auth.logout();
                } else {
                    auth.reset();
                }
            }
        }
    }}>
        {children}
    </SWRConfig>;


}
