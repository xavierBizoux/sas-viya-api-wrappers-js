import { CookieAuthenticationCredential } from '@sassoftware/sas-auth-browser'
import APICall from './ApiCalls'
import { ApiResponse, Item, Link, OutputType } from './ApiCalls.types'

export default class ComputeSession {
    contextName: string
    session: ApiResponse | null
    context: Item | null
    server: string
    sasInstance: CookieAuthenticationCredential

    /**
     * ComputeSession class
     * @class ComputeSession
     * @classdesc This class provides an interface to the SAS Viya Compute API.
     * @param {string} server The URL of the SAS Viya server.
     * @param {string} [contextName='SAS Job Execution compute context'] The name of the context to use.
     * @param {CookieAuthenticationCredential} [sasInstance] The authentication instance to use.
     */
    constructor(
        server: string,
        contextName: string = 'SAS Job Execution compute context',
        sasInstance?: CookieAuthenticationCredential
    ) {
        this.server = server
        this.contextName = contextName
        this.session = null
        this.context = null
        this.sasInstance = sasInstance || new CookieAuthenticationCredential({ url: server })
    }

    private readonly getComputeContext = async () => {
        const link: Link = {
            method: 'GET',
            rel: 'self',
            href: '/compute/contexts',
            type: 'application/vnd.sas.collection',
        }
        const api = new APICall({
            server: this.server,
            link: link,
            sasInstance: this.sasInstance,
        })
        const response = await api.execute()
        if (response) {
            const context = response.items.find((element: Item) =>
                element.name?.includes(this.contextName)
            )
            this.context = context as Item
        } else {
            throw new Error(`Context ${this.contextName} not found`)
        }
    }

    private readonly createSession = async () => {
        if (this.context === null) {
            await this.getComputeContext()
        }
        const link = this.context!.links.find((element) => element.rel === 'createSession') as Link
        const api = new APICall({
            server: this.server,
            sasInstance: this.sasInstance,
            link: link,
        })
        this.session = await api.execute()
    }

    logout = async () => {
        this.deleteSession()
        await this.sasInstance.logout()
        this.sasInstance.invalidateCache()
    }

    deleteSession = async () => {
        if (this.session !== null) {
            const link = this.session.links.find((element) => element.rel === 'delete') as Link
            const api = new APICall({
                server: this.server,
                sasInstance: this.sasInstance,
                link: link,
            })
            await api.execute()
            this.session = null
        }
    }

    getComputeContexts = async () => {
        if (this.session === null) {
            await this.createSession()
        }
        const link: Link = {
            method: 'GET',
            rel: 'self',
            href: '/compute/contexts',
            type: 'application/vnd.sas.collection',
        }
        const api = new APICall({
            server: this.server,
            link: link,
            sasInstance: this.sasInstance,
        })
        const response = await api.execute()
        if (response) {
            return response?.items.map((element: Item) => element.name) ?? []
        } else {
            throw new Error('No context found')
        }
    }

    getLibraries = async (outputType: OutputType = 'data') => {
        if (this.session === null) {
            await this.createSession()
        }
        const link = this.session!.links.find((element) => element.rel === 'librefs')
        if (link === undefined) {
            throw new Error('No libraries found')
        }
        const api = new APICall({
            server: this.server,
            sasInstance: this.sasInstance,
            link: link,
        })
        const response = await api.execute()
        if (outputType === 'data') {
            return response?.items.map((element: Item) => element.name) ?? []
        } else {
            return response?.items
        }
    }

    getTables = async (libraryName: string, outputType: OutputType = 'data') => {
        if (this.session === null) {
            await this.createSession()
        }
        const libraries = (await this.getLibraries('api')) as Item[]
        if (libraries.length === 0) {
            throw new Error('No libraries found')
        }
        const library = libraries.find((element) => element.name === libraryName)
        if (library === undefined) {
            throw new Error(`Library ${libraryName} not found`)
        }
        const libraryApi = new APICall({
            server: this.server,
            sasInstance: this.sasInstance,
            link: library.links[0],
        })
        const libraryInfo = await libraryApi.execute()
        const link = libraryInfo!.links.find((element: Link) => element.rel === 'tables')
        if (link === undefined) {
            throw new Error(`No tables found in library ${libraryName}`)
        }
        const headers = new Headers()
        headers.set('Accept', 'application/vnd.sas.collection+json')
        const api = new APICall({
            server: this.server,
            sasInstance: this.sasInstance,
            link: link,
            headers: headers,
        })
        const response = await api.execute()
        if (outputType === 'data') {
            return response?.items.map((element: Item) => element.name) ?? []
        } else {
            return response?.items
        }
    }

    getColumns = async (
        libraryName: string,
        tableName: string,
        outputType: OutputType = 'data'
    ) => {
        if (this.session === null) {
            await this.createSession()
        }
        const tables = (await this.getTables(libraryName, 'api')) as Item[]
        const table = tables.find((element) => element.name === tableName)
        if (table === undefined) {
            throw new Error(`Table ${tableName} not found in library ${libraryName}`)
        }
        const tableApi = new APICall({
            server: this.server,
            sasInstance: this.sasInstance,
            link: table.links[0],
        })
        const tableInfo = await tableApi.execute()
        const link = tableInfo!.links.find((element: Link) => element.rel === 'columns')
        if (link === undefined) {
            throw new Error(`No columns found in table ${libraryName}.${tableName}`)
        }
        const api = new APICall({
            server: this.server,
            sasInstance: this.sasInstance,
            link: link,
        })
        const response = await api.execute()
        if (outputType === 'data') {
            return response?.items.map((element: Item) => element.name) ?? []
        } else {
            return response?.items ?? []
        }
    }

    getValues = async (
        libraryName: string,
        tableName: string,
        columnName: string,
        filters?: { column: string; value: string }[]
    ) => {
        if (this.session === null) {
            await this.createSession()
        }
        const columns = (await this.getColumns(libraryName, tableName, 'api')) as Item[]
        const column = columns.find((element) => element.name === columnName)
        if (column === undefined) {
            throw new Error(`Column ${columnName} not found in table ${libraryName}.${tableName}`)
        }
        let sql = `proc sql; create view promptValues as select distinct ${columnName} from ${libraryName}.${tableName};quit;`
        if (filters) {
            const filterData: { [key: string]: string[] } = {}
            filters.forEach((element) => {
                if (filterData[element.column] === undefined) {
                    filterData[element.column] = []
                }
                filterData[element.column].push(element.value)
            })
            const whereClause = Object.keys(filterData)
                .map((key) => {
                    const values = filterData[key].map((element) => `'${element}'`)
                    return `${key} in (${values.join(', ')})`
                })
                .join(' and ')
            sql = `proc sql; create view promptValues as select distinct ${columnName} from ${libraryName}.${tableName} where ${whereClause};quit;`
        }
        const SASCode = [
            sql,
            'filename json temp;',
            'proc json out=json pretty nokeys nosastags; export promptValues ; run;',
        ]
        const data = await this.executeCode(SASCode)
        return data ?? []
    }
    executeCode = async (code: string[]) => {
        if (this.session === null) {
            await this.createSession()
        }
        const link: Link = {
            method: 'POST',
            rel: 'self',
            href: `/compute/sessions/${this.session!.id}/jobs`,
            type: 'application/vnd.sas.compute.job.request+json',
        }
        const headers = new Headers()
        headers.set('Accept', 'application/vnd.sas.compute.job+json')
        const api = new APICall({
            server: this.server,
            sasInstance: this.sasInstance,
            link: link,
            headers: headers,
            data: JSON.stringify({ code: code }),
        })
        const response = await api.execute()
        const results = response!.links.find((element: Link) => element.rel === 'results')
        if (results === undefined) {
            throw new Error('No results found')
        }
        const resultsApi = new APICall({
            server: this.server,
            sasInstance: this.sasInstance,
            link: results,
        })
        const resultsInfo = await resultsApi.execute()
        const result = resultsInfo!.items.find((element: Item) => element.id === 'json')
        if (result === undefined) {
            throw new Error('No result found')
        }
        const resultApi = new APICall({
            server: this.server,
            sasInstance: this.sasInstance,
            link: result.links[0],
        })
        const resultInfo = await resultApi.execute()
        const content = resultInfo!.links.find((element: Link) => element.rel === 'content')
        if (content === undefined) {
            throw new Error('No content found')
        }
        const contentApi = new APICall({
            server: this.server,
            sasInstance: this.sasInstance,
            link: content,
        })
        return await contentApi.execute()
    }
}
