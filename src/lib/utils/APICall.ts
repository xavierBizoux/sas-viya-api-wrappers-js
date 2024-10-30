import { CookieAuthenticationCredential } from '@sassoftware/sas-auth-browser'
import axios, { AxiosHeaders, AxiosInstance, AxiosResponse } from 'axios'
import { APICallProps, Link } from '../types/APICall.types'

const DEFAULT_LIMIT = 100
const DEFAULT_RETRIES = 3

export default class APICall {
    private link: Link
    private instance: AxiosInstance
    private searchParams: URLSearchParams
    private data: {} | undefined
    private auth: CookieAuthenticationCredential
    constructor({
        baseURL,
        link,
        data = undefined,
        searchParams = new URLSearchParams(),
        headers = new Headers(),
    }: APICallProps) {
        this.link = link
        this.auth = new CookieAuthenticationCredential({
            url: baseURL,
        })
        this.searchParams = searchParams
        this.setQueryParams()
        this.data = data
        this.instance = axios.create({
            baseURL: baseURL,
            headers: this.setHeaders(headers),
            withCredentials: true,
        })
        this.instance.interceptors.request.use(
            async (config) => {
                await this.authenticate()
                return config
            },
            (error) => {
                return Promise.reject(error)
            }
        )
        this.instance.interceptors.response.use(undefined, (err) => {
            const { response, config, message } = err
            if (response.status === 405) {
                return Promise.resolve(response)
            }
            if (!(message.includes('timeout') || message.includes('Network Error'))) {
                return Promise.reject(err)
            }
            if (!config) {
                return Promise.reject(err)
            }
            if (!config.retry) {
                config.retry = DEFAULT_RETRIES
            }
            if (response.status === 449) {
                config.retry -= 1
                return this.instance(config)
            }
        })
    }

    private readonly authenticate = async () => {
        try {
            await this.auth.checkAuthenticated()
        } catch {
            this.auth.invalidateCache()
            await this.auth.loginPopup()
        }
    }

    logout = async () => {
        await this.auth.logout()
        this.auth.invalidateCache()
    }

    private readonly getCSRFToken = async () => {
        const response = await this.instance.head(this.link.href)
        if (response.status === 405) {
            await this.instance.get(this.link.href)
        }
        if (response.headers['x-csrf-token']) {
            this.instance.defaults.headers.common['x-csrf-token'] = response.headers['x-csrf-token']
        }
    }

    private readonly setHeaders = (inputHeaders: Headers) => {
        const headers = new AxiosHeaders()
        if (inputHeaders) {
            for (const [key, value] of inputHeaders.entries()) {
                headers.set(key, value)
            }
        }
        this.link.type
            ? headers.set('Content-Type', `${this.link.type}+json`)
            : headers.set('Content-Type', 'application/json')

        this.link.itemType
            ? headers.set('Accept', 'application/vnd.sas.collection+json')
            : undefined

        !headers.has('Accept') ? headers.set('Accept', 'application/json') : undefined

        return headers
    }

    private readonly setQueryParams = () => {
        if (!this.searchParams.has('limit') && this.link.method === 'GET') {
            this.searchParams.append('limit', DEFAULT_LIMIT.toString())
        }
        if (this.link.method === 'DELETE') {
            this.searchParams.delete('limit')
        }
    }

    execute = async () => {
        if (this.link.method !== 'GET') {
            await this.getCSRFToken()
        }
        const response = await this.instance({
            method: this.link.method,
            url: this.link.href,
            data: this.data,
            params: this.searchParams,
        })
        return response as AxiosResponse
    }
}
