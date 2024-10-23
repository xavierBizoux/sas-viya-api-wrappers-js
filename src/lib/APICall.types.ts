export type Link = {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
    rel: string
    uri: string
    href: string
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
    modifiedBy: string
    modifiedTimeStamp: string
    version: number
    links: Link[]
    accept: string
    name?: string
    description?: string
    type?: string
    limit?: number
    start?: number
    filter?: string
    orderBy?: string
}

export type APICallProps = {
    baseURL: string
    link: Link
    data?: {}
    searchParams?: URLSearchParams
    headers?: Headers
}
