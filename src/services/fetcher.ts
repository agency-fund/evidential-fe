import {API_URL} from "@/services/pkce";
import {MutationFetcher} from "swr/mutation";

// TODO: replace these with generated types
export interface PostApiKeysResponse {
    id: string
    key: string
    datasource_ids: string[]
}
export interface ApiKey {
    id: string
    key: string
    datasource_ids: string[]
}
export interface Datasource {
    id: string
    type: string
    secured: boolean
}

export const fetchWithToken = async (token: string, path: string) => {
    const res = await fetch(`${API_URL}/${path}`, {headers: {'Authorization': `Bearer ${token}`}});
    if (!res.ok) {
        const error = new Error('An error occurred while fetching the data.')
        // @ts-expect-error todo
        error.info = await res.json()
        // @ts-expect-error todo
        error.status = res.status
        throw error
    }
    return await res.json();
};



// TODO: accept token differently
export const createApiKeyFetcher: MutationFetcher<PostApiKeysResponse, string, {
    token: string,
    datasource_ids: string[]
}> = async (path: string, {arg: {token, datasource_ids}}) => {
    return fetch(`${API_URL}/${path}`, {
        method: "POST", body: JSON.stringify({datasource_ids}),
        headers: {'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json'}
    }).then(res => res.json());
}

export const deleteApiKeyFetcher = async (path: string, {arg: {token, apikey_id}}: {
    arg: { token: string, apikey_id: string }
}) => {
    return fetch(`${API_URL}/${path}/${apikey_id}`, {
        method: "DELETE",
        headers: {'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json'}
    }).then(res => res.json());
}
