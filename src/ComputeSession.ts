import { CookieAuthenticationCredential } from '@sassoftware/sas-auth-browser'
import { callViyaApi } from './lib/callViyaApi'
import { ApiParameters, ApiResponse, Item, Link, OutputType } from './lib/callViyaApi.types'

export default class ComputeSession {
    contextName: string
    session: ApiResponse | null
    context: Item | null
    server: string
    sasInstance: CookieAuthenticationCredential
    constructor(server: string, contextName: string = 'SAS Job Execution compute context') {
        this.server = server
        this.contextName = contextName
        this.session = null
        this.context = null
        this.sasInstance = new CookieAuthenticationCredential({ url: server })
    }
    private getComputeContext = async () => {
        const link: Link = {
            method: 'GET',
            rel: 'self',
            href: '/compute/contexts',
            type: 'application/vnd.sas.collection',
        }

        const response = await callViyaApi({
            server: this.server,
            sasInstance: this.sasInstance,
            link: link,
        })
        if (response) {
            const [context] = response.items.filter((element) =>
                element.name?.includes(this.contextName) ? element : null
            )
            this.context = context
        } else {
            throw new Error('Context not found')
        }
    }
    private createSession = async () => {
        if (this.context === null) {
            await this.getComputeContext()
        }
        const [link] = this.context!.links.filter((element) =>
            element.rel === 'createSession' ? element : null
        )
        this.session = await callViyaApi({
            server: this.server,
            sasInstance: this.sasInstance,
            link: link,
        })
    }
    deleteSession = async () => {
        if (this.session !== null) {
            const [link] = this.session.links.filter((element) =>
                element.rel === 'delete' ? element : null
            )
            await callViyaApi({ server: this.server, sasInstance: this.sasInstance, link: link })
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

        const response = await callViyaApi({
            server: this.server,
            sasInstance: this.sasInstance,
            link: link,
        })
        if (outputType === 'data') {
            return response?.items.map((element) => element.name) ?? []
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
        const libraryInfo = await callViyaApi({
            server: this.server,
            sasInstance: this.sasInstance,
            link: library.links[0],
        })
        const link = libraryInfo!.links.find((element) => element.rel === 'tables')
        if (link === undefined) {
            throw new Error('No tables found in library')
        }
        const headers = new Headers()
        headers.set('Accept', 'application/vnd.sas.collection+json')
        const apiParams = { headers: headers } as ApiParameters
        const response = await callViyaApi({
            server: this.server,
            sasInstance: this.sasInstance,
            link: link,
            options: apiParams,
        })
        if (outputType === 'data') {
            return response?.items.map((element) => element.name) ?? []
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
        const tableInfo = await callViyaApi({
            server: this.server,
            sasInstance: this.sasInstance,
            link: table.links[0],
        })
        const link = tableInfo!.links.find((element) => element.rel === 'columns')
        if (link === undefined) {
            throw new Error('No columns found in table')
        }
        const response = await callViyaApi({
            server: this.server,
            sasInstance: this.sasInstance,
            link: link,
        })
        if (outputType === 'data') {
            return response?.items.map((element) => element.name) ?? []
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
        const columns = (await this.getColumns(libraryName, tableName, 'api')) as Item[]
        const column = columns.find((element) => element.name === columnName)
        if (column === undefined) {
            throw new Error(`Column ${columnName} not found in table ${libraryName}.${tableName}`)
        }
        let sql = `proc sql; create view promptValues as select distinct ${columnName} from ${libraryName}.${tableName};quit;`
        if (filters) {
            const whereClause = filters
                .map((elements) => `${elements.column} = '${elements.value}'`)
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
        const apiParams = {
            headers: headers,
            data: JSON.stringify({ code: code }),
        } as ApiParameters
        const response = await callViyaApi({
            server: this.server,
            sasInstance: this.sasInstance,
            link: link,
            options: apiParams,
        })
        const results = response!.links.find((element) => element.rel === 'results')
        if (results === undefined) {
            throw new Error('No results found')
        }
        const resultsInfo = await callViyaApi({
            server: this.server,
            sasInstance: this.sasInstance,
            link: results,
        })
        const result = resultsInfo!.items.find((element) => element.id === 'json')
        if (result === undefined) {
            throw new Error('No result found')
        }
        const resultInfo = await callViyaApi({
            server: this.server,
            sasInstance: this.sasInstance,
            link: result.links[0],
        })
        const content = resultInfo!.links.find((element) => element.rel === 'content')
        if (content === undefined) {
            throw new Error('No content found')
        }
        const data = await callViyaApi({
            server: this.server,
            sasInstance: this.sasInstance,
            link: content,
        })
        return data
    }
}
