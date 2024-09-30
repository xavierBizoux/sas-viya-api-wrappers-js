import { ApiParameters, ApiResponse, CallViyaApiParameters, Link } from './callViyaApi.types'

// Variable to store the CSRF Token that is required for POST requests
let csrfToken: string | null = null
// Default limit for API calls
const defaultLimit = 100

// Generate Headers for API calls
const generateHeaders = (link: Link, options?: ApiParameters) => {
    const headers = new Headers()
    headers.set('Content-Type', link.type ? `${link.type}+json` : 'application/json')
    if (options?.headers) {
        for (const [key, value] of options.headers.entries()) {
            headers.set(key, value)
        }
    }
    if (link.responseType) {
        headers.set('Accept', `${link.responseType}+json`)
    }
    if (csrfToken) {
        headers.set('x-csrf-token', csrfToken)
    }
    return headers
}

// Generate URL for API calls
const generateUrl = (server: string, link: Link, options?: ApiParameters) => {
    let url = `${server}${link.href}`
    const urlParams = new URLSearchParams()
    if (options?.limit) {
        urlParams.set('limit', options.limit.toString())
    } else {
        urlParams.set('limit', defaultLimit.toString())
    }
    if (options?.filter) {
        urlParams.set('filter', options.filter)
    }
    if (options?.includeColumns) {
        urlParams.set('includeColumns', options.includeColumns)
    }
    if (urlParams.toString()) {
        url += `?${urlParams}`
    }
    return url
}

// Generate RequestInit object for API calls
const generateRequestInit = (link: Link, headers: Headers, options?: ApiParameters) => {
    const requestInit: RequestInit = {
        headers,
        method: link.method,
        credentials: 'include',
    }
    if (options?.data) {
        requestInit.body = options.data
    }
    return requestInit
}

// Function to call REST APIs
export const callViyaApi = async ({
    server,
    sasInstance,
    link,
    options,
}: CallViyaApiParameters): Promise<ApiResponse | null> => {
    // User authentication before executing calls to REST APIs
    try {
        // Check if user is authenticated
        console.log('check')
        await sasInstance.checkAuthenticated()
    } catch {
        console.log('error')
        await sasInstance.invalidateCache()
        await sasInstance.loginPopup()
    }
    // Generate elements for API call
    const url = generateUrl(server, link, options)
    const headers = generateHeaders(link, options)
    const requestOptions = generateRequestInit(link, headers, options)
    // Call REST API
    try {
        const response = await fetch(url, requestOptions)
        if (response.ok) {
            // Store CSRF token if present for later usage
            if (response.headers.get('x-csrf-token')) {
                csrfToken = response.headers.get('x-csrf-token')
            }
            // Transform the response into a JSON object
            const json = await response.json()
            // Return the response
            return json
        } else {
            // Generate error if the request failed
            throw new Error(`Call to ${link.href} failed with message: "${response.statusText}"`)
        }
    } catch (error: unknown) {
        // handle Error object
        if (typeof error === 'string') {
            console.error(`An error occurred while calling ${link.href}: ${error}`)
        } else if (error instanceof Error) {
            console.error(`An error occurred while calling ${link.href}: ${error.message}`)
        }
        throw error
    }
}
