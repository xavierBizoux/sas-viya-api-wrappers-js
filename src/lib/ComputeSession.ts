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
    private readonly findElement = <T extends Item | Link>(elements: T[], value: string): T => {
        const element = elements.find(
            (element: T) =>
                ('name' in element && element.name === value) ||
                ('rel' in element && element.rel === value)
        )
        if (element === undefined) {
            throw new Error(`Element ${value} not found`)
        }
        return element
    }

    private readonly generateOutput = (items: Item[], outputType: OutputType) => {
        if (items.length !== 0) {
            if (outputType === 'data') {
                return items.map((element: Item) => element.name) ?? []
            } else {
                return items
            }
        } else {
            throw new Error('No items found')
        }
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
        const response = (await api.execute()) as ApiResponse
        if (response) {
            this.context = this.findElement(response.items, this.contextName)
        }
        if (this.context === null) {
            throw new Error(`Compute context ${this.contextName} not found`)
        }
    }

    private readonly createSession = async () => {
        if (this.context === null) {
            await this.getComputeContext()
        }
        const link = this.findElement(this.context!.links, 'createSession')
        const api = new APICall({
            server: this.server,
            sasInstance: this.sasInstance,
            link: link,
        })
        this.session = (await api.execute()) as ApiResponse
    }

    logout = async () => {
        this.deleteSession()
        await this.sasInstance.logout()
        this.sasInstance.invalidateCache()
    }

    deleteSession = async () => {
        if (this.session !== null) {
            const link = this.findElement(this.session.links, 'delete')
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
        const response = (await api.execute()) as ApiResponse
        if (response) {
            return this.generateOutput(response.items, 'data')
        }
    }

    getLibraries = async (outputType: OutputType = 'data') => {
        if (this.session === null) {
            await this.createSession()
        }
        const link = this.findElement(this.session!.links, 'librefs')
        const api = new APICall({
            server: this.server,
            sasInstance: this.sasInstance,
            link: link,
        })
        const response = (await api.execute()) as ApiResponse
        if (response) {
            return this.generateOutput(response.items, outputType)
        }
    }

    getTables = async (libraryName: string, outputType: OutputType = 'data') => {
        if (this.session === null) {
            await this.createSession()
        }
        const libraries = (await this.getLibraries('api')) as Item[]
        const library = this.findElement(libraries, libraryName)
        const libraryApi = new APICall({
            server: this.server,
            sasInstance: this.sasInstance,
            link: library.links[0],
        })
        const libraryInfo = await libraryApi.execute()
        const link = this.findElement(libraryInfo!.links, 'tables')
        const headers = new Headers()
        headers.set('Accept', 'application/vnd.sas.collection+json')
        const api = new APICall({
            server: this.server,
            sasInstance: this.sasInstance,
            link: link,
            headers: headers,
        })
        const response = await api.execute()
        if (response) {
            return this.generateOutput(response.items, outputType)
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
        const table = this.findElement(tables, tableName)
        const tableApi = new APICall({
            server: this.server,
            sasInstance: this.sasInstance,
            link: table.links[0],
        })
        const tableInfo = await tableApi.execute()
        const link = this.findElement(tableInfo!.links, 'columns')
        const api = new APICall({
            server: this.server,
            sasInstance: this.sasInstance,
            link: link,
        })
        const response = await api.execute()
        if (response) {
            return this.generateOutput(response.items, outputType)
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
        const column = this.findElement(columns, columnName)
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
        const results = this.findElement(response!.links, 'results')
        const resultsApi = new APICall({
            server: this.server,
            sasInstance: this.sasInstance,
            link: results,
        })
        const resultsInfo = await resultsApi.execute()
        const result = this.findElement(resultsInfo!.items, 'json')
        const resultApi = new APICall({
            server: this.server,
            sasInstance: this.sasInstance,
            link: result.links[0],
        })
        const resultInfo = await resultApi.execute()
        const content = this.findElement(resultInfo!.links, 'content')
        const contentApi = new APICall({
            server: this.server,
            sasInstance: this.sasInstance,
            link: content,
        })
        return await contentApi.execute()
    }
}
