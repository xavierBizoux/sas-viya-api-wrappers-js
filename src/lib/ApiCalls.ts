import { CookieAuthenticationCredential } from '@sassoftware/sas-auth-browser'
import { APICallProps, ApiResponse, Link } from './ApiCalls.types'

const DEFAULT_LIMIT = 100

export default class APICall {
    private sasInstance: CookieAuthenticationCredential
    private server: string
    private link: Link
    private headers: Headers
    private urlSearchParams: URLSearchParams
    private requestInit: RequestInit
    private CSRFToken: string | null = null

    constructor({
        server,
        link,
        sasInstance = new CookieAuthenticationCredential({ url: server }),
        headers,
        data,
        urlSearchParams = new URLSearchParams(),
    }: APICallProps) {
        this.server = server
        this.link = link
        this.sasInstance = sasInstance

        this.headers = new Headers(headers || {})
        this.setHeaders(link)
        this.urlSearchParams = this.initializeUrlSearchParams(urlSearchParams, link.method)
        this.requestInit = this.createRequestInit(data, link.method)
    }

    private setHeaders(link: Link) {
        const contentType = link.type ? `${link.type}+json` : 'application/json'
        this.headers.set('Content-Type', contentType)

        const acceptHeader = link.responseType
            ? `${link.responseType}+json`
            : link.method === 'DELETE'
            ? 'application/vnd.sas.error+json,application/json'
            : undefined

        if (acceptHeader) {
            this.headers.set('Accept', acceptHeader)
        }
    }

    private initializeUrlSearchParams(
        urlSearchParams: URLSearchParams,
        method: string
    ): URLSearchParams {
        if (!urlSearchParams.has('limit') && method === 'GET') {
            urlSearchParams.set('limit', DEFAULT_LIMIT.toString())
        } else {
            urlSearchParams.delete('limit')
        }
        return urlSearchParams
    }

    private createRequestInit(data: string | undefined, method: string): RequestInit {
        const init: RequestInit = {
            method,
            credentials: 'include',
        }
        if (data) {
            init.body = data
        }
        return init
    }

    private async authenticate() {
        try {
            await this.sasInstance.checkAuthenticated()
        } catch {
            this.sasInstance.invalidateCache()
            await this.sasInstance.loginPopup()
        }
    }

    private async getCSRFToken() {
        const response = await fetch(`${this.server}${this.link.href}`, {
            method: 'HEAD',
            credentials: 'include',
        })
        this.CSRFToken = response.headers.get('x-csrf-token')
    }

    public async execute() {
        await this.authenticate()
        await this.getCSRFToken()
        if (this.CSRFToken) {
            this.headers.set('x-csrf-token', this.CSRFToken)
        }

        const url = this.buildUrl()
        this.requestInit.headers = this.headers

        try {
            let response = await fetch(url, this.requestInit)
            if (response.status === 449) {
                response = await fetch(url, this.requestInit)
            }
            return (await this.handleResponse(response)) as ApiResponse
        } catch (error) {
            this.handleError(error)
        }
    }

    private buildUrl(): string {
        const baseUrl = `${this.server}${this.link.href}`
        return this.urlSearchParams.toString() ? `${baseUrl}?${this.urlSearchParams}` : baseUrl
    }

    private async handleResponse(response: Response) {
        if (response.ok) {
            this.CSRFToken = response.headers.get('x-csrf-token') || this.CSRFToken
            if (response.status === 204) return null
            return await response.json()
        } else {
            throw new Error(
                `Call to ${this.link.href} failed with message: "${response.statusText}"`
            )
        }
    }

    private handleError(error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error(`An error occurred while calling ${this.link.href}: ${errorMessage}`)
        throw error
    }
}
