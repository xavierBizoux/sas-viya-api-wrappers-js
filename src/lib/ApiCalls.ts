import { CookieAuthenticationCredential } from '@sassoftware/sas-auth-browser'
import { APICallProps, Link } from './ApiCalls.types'

const DEFAULT_LIMIT = 100

export default class APICall {
    sasInstance: CookieAuthenticationCredential
    server: string
    link: Link
    headers!: Headers
    urlSearchParams!: URLSearchParams
    requestInit: RequestInit
    CSRFToken!: string | null

    /**
     * Construct an APICall object.
     *
     * @param {APICallProps} options - Options to construct the APICall object.
     * @param {string} options.server - The SAS Viya server.
     * @param {Link} options.link - A link object that contains the method, rel, and other required information.
     * @param {CookieAuthenticationCredential} [options.sasInstance] - The authentication instance to use.
     * @param {Headers} [options.headers] - The headers to include in the request.
     * @param {string} [options.data] - The data to include in the request body.
     * @param {URLSearchParams} [options.urlSearchParams] - The URL search parameters to include in the request.
     */
    constructor({
        server,
        link,
        sasInstance = new CookieAuthenticationCredential({
            url: server,
        }),
        headers,
        data,
        urlSearchParams = new URLSearchParams(),
    }: APICallProps) {
        this.server = server
        this.link = link
        this.sasInstance = sasInstance
        if (headers) {
            this.headers = new Headers(headers)
        } else {
            this.headers = new Headers()
        }

        // Set the Content-Type header.
        if (link.type) {
            this.headers.set('Content-Type', `${link.type}+json`)
        } else {
            this.headers.set('Content-Type', 'application/json')
        }

        // Set the Accept header.
        if (link.responseType) {
            this.headers.set('Accept', `${link.responseType}+json`)
        } else if (link.method === 'DELETE') {
            this.headers.set('Accept', 'application/vnd.sas.error+json,application/json')
        }

        // Set URLSearchParams
        if (!urlSearchParams.has('limit') && link.method === 'GET') {
            urlSearchParams.set('limit', DEFAULT_LIMIT.toString())
        } else {
            urlSearchParams.delete('limit')
        }
        this.urlSearchParams = urlSearchParams

        // Set requestInit
        this.requestInit = {
            method: link.method,
            credentials: 'include',
        }
        if (data) {
            this.requestInit.body = data
        }
    }

    private readonly authenticate = async () => {
        try {
            // Check if user is authenticated
            await this.sasInstance.checkAuthenticated()
        } catch {
            this.sasInstance.invalidateCache()
            await this.sasInstance.loginPopup()
        }
    }

    private readonly getCSRFToken = async () => {
        const url = `${this.server}${this.link.href}`
        const response = await fetch(url, { method: 'OPTIONS', credentials: 'include' })
        if (response.headers.get('x-csrf-token')) {
            this.CSRFToken = response.headers.get('x-csrf-token')
        }
    }

    execute = async () => {
        await this.authenticate()
        await this.getCSRFToken()
        if (this.CSRFToken) {
            this.headers.set('x-csrf-token', this.CSRFToken)
        }
        let url = `${this.server}${this.link.href}`
        if (this.urlSearchParams.toString().length > 0) {
            url += `?${this.urlSearchParams.toString()}`
        }
        this.requestInit.headers = this.headers
        try {
            let response = await fetch(url, this.requestInit)
            if (response.status === 449) {
                response = await fetch(url, this.requestInit)
            }
            if (response.ok) {
                if (response.headers.get('x-csrf-token')) {
                    this.CSRFToken = response.headers.get('x-csrf-token')
                }
                if (response.status === 204) {
                    return null
                }
                const json = await response.json()
                // Return the response
                return json
            } else {
                throw new Error(
                    `Call to ${this.link.href} failed with message: "${response.statusText}"`
                )
            }
        } catch (error: unknown) {
            if (typeof error === 'string') {
                console.error(`An error occurred while calling ${this.link.href}: ${error}`)
            } else if (error instanceof Error) {
                console.error(
                    `An error occurred while calling ${this.link.href}: ${error?.message}`
                )
            }
            throw error
        }
    }
}
