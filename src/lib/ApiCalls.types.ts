import { CookieAuthenticationCredential } from '@sassoftware/sas-auth-browser'
export type ApiResponse = {
    name: string
    count: number
    items: Item[]
    links: Link[]
    limit: number
    start: number
    version: number
    accept?: string
    id?: string
    rows?: []
}

export type Link = {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
    rel: string
    uri?: string
    href?: string
    title?: string
    type?: string
    itemType?: string
    responseType?: string
    responseItemType?: string
}

export type Item = {
    createdBy: string
    creationTimeStamp: string
    id: string
    name?: string
    links: Link[]
    modifiedBy: string
    modifiedTimeStamp: string
    version: number
}

export type OutputType = 'data' | 'api'

export type APICallProps = {
    server: string
    link: Link
    sasInstance: CookieAuthenticationCredential
    headers?: Headers
    data?: string
    urlSearchParams?: URLSearchParams
    CSRFToken?: string
}
