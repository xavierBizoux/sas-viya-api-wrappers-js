import APICall from './APICall'
import { Item, Link } from './APICall.types'
import {
    CheckJobStateProps,
    ComputeServerColumn,
    ComputeServerJob,
    ComputeServerLibrary,
    ComputeServerTable,
    ComputeSessionProps,
    ExecuteCodeProps,
    GenerateOutputProps,
    GetColumnProps,
    GetColumnsProps,
    GetJobResultProps,
    GetLibrariesProps,
    GetLibraryProps,
    GetTableProps,
    GetTablesProps,
    GetValuesProps,
    ComputeContext as TComputeContext,
    ComputeSession as TComputeSession,
} from './ComputeSession.types'

export default class ComputeSession {
    baseURL: string
    contextName: string
    context: TComputeContext | null
    session: TComputeSession | null

    constructor({
        baseURL,
        contextName = 'SAS Job Execution compute context',
    }: ComputeSessionProps) {
        this.baseURL = baseURL
        this.contextName = contextName
        this.context = null
        this.session = null
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

    private readonly generateOutput = ({
        items,
        outputType = 'api',
    }: GenerateOutputProps): Item[] | Link[] | (string | undefined)[] => {
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

    createSession = async () => {
        if (this.context === null) {
            await this.getComputeContext()
        }
        const link = this.findElement(this.context!.links, 'createSession')
        const call = new APICall({ baseURL: this.baseURL, link: link })
        const response = await call.execute()
        if (response) {
            this.session = response.data as TComputeSession
        }
    }

    deleteSession = async () => {
        if (this.session !== null) {
            const links = this.session.links
            const link = this.findElement(this.session.links, 'delete')
            const call = new APICall({ baseURL: this.baseURL, link: link })
            const response = await call.execute()
            if (response) {
                call.logout()
                this.session = null
            }
        }
    }

    getComputeContexts = async () => {
        const link: Link = {
            method: 'GET',
            rel: 'self',
            uri: '/compute/contexts',
            href: '/compute/contexts',
        }
        const call = new APICall({ baseURL: this.baseURL, link: link })
        const response = await call.execute()
        if (response) {
            return this.generateOutput({ items: response.data.items, outputType: 'data' })
        }
    }

    private readonly getComputeContext = async () => {
        const link: Link = {
            method: 'GET',
            rel: 'self',
            uri: `/compute/contexts`,
            href: `/compute/contexts`,
            type: 'application/vnd.sas.collection',
        }
        const call = new APICall({ baseURL: this.baseURL, link: link })
        const response = await call.execute()
        if (response && response.data.items) {
            const items = response.data.items as Item[]
            this.context = this.findElement(items, this.contextName) as TComputeContext
        }
        if (this.context === null) {
            throw new Error(`Compute context ${this.contextName} not found`)
        }
    }

    getLibraries = async ({ outputType = 'data' }: GetLibrariesProps = {}) => {
        if (this.session === null) {
            await this.createSession()
        }
        if (this.session !== null) {
            const link = this.findElement(this.session.links, 'librefs')
            const call = new APICall({ baseURL: this.baseURL, link: link })
            const response = await call.execute()
            if (response) {
                return this.generateOutput({ items: response.data.items, outputType: outputType })
            }
        }
    }

    private readonly getLibrary = async ({ libraryName }: GetLibraryProps) => {
        if (this.session === null) {
            await this.createSession()
        }
        if (this.session !== null) {
            const libraries = (await this.getLibraries({ outputType: 'api' })) as Item[]
            const link = this.findElement(libraries, libraryName).links[0] as Link
            const call = new APICall({ baseURL: this.baseURL, link: link })
            const response = await call.execute()
            if (response && response.data) {
                return response.data as ComputeServerLibrary
            }
        }
    }

    getTables = async ({ libraryName, outputType = 'data' }: GetTablesProps) => {
        if (this.session === null) {
            await this.createSession()
        }
        if (this.session !== null) {
            const library = (await this.getLibrary({
                libraryName: libraryName,
            })) as ComputeServerLibrary
            if (library && library.links) {
                const link = this.findElement(library.links, 'tables') as Link
                const searchParams = new URLSearchParams({ limit: '1000' })
                const call = new APICall({
                    baseURL: this.baseURL,
                    link: link,
                    searchParams: searchParams,
                })
                const response = await call.execute()
                if (response) {
                    return this.generateOutput({
                        items: response.data.items,
                        outputType: outputType,
                    })
                }
            }
        }
    }

    private readonly getTable = async ({ libraryName, tableName }: GetTableProps) => {
        if (this.session === null) {
            await this.createSession()
        }
        if (this.session !== null) {
            const tables = (await this.getTables({
                libraryName: libraryName,
                outputType: 'api',
            })) as Item[]
            if (tables) {
                const link = this.findElement(tables, tableName).links[0] as Link
                const call = new APICall({ baseURL: this.baseURL, link: link })
                const response = await call.execute()
                if (response) {
                    return response.data as ComputeServerTable
                }
            }
        }
    }

    getColumns = async ({ libraryName, tableName, outputType = 'data' }: GetColumnsProps) => {
        if (this.session === null) {
            await this.createSession()
        }
        if (this.session !== null) {
            const table = (await this.getTable({
                libraryName: libraryName,
                tableName: tableName,
            })) as ComputeServerTable
            if (table && table.links) {
                const link = this.findElement(table.links, 'columns') as Link
                const call = new APICall({ baseURL: this.baseURL, link: link })
                const response = await call.execute()
                if (response) {
                    return this.generateOutput({
                        items: response.data.items,
                        outputType: outputType,
                    })
                }
            }
        }
    }

    private readonly getColumn = async ({ libraryName, tableName, columnName }: GetColumnProps) => {
        if (this.session === null) {
            await this.createSession()
        }
        if (this.session !== null) {
            const columns = (await this.getColumns({
                libraryName: libraryName,
                tableName: tableName,
                outputType: 'api',
            })) as Item[]
            if (columns) {
                const link = this.findElement(columns, columnName).links[0] as Link
                const call = new APICall({ baseURL: this.baseURL, link: link })
                const response = await call.execute()
                if (response) {
                    return response.data as ComputeServerColumn
                }
            }
        }
    }

    getValues = async ({ libraryName, tableName, columnName, filters }: GetValuesProps) => {
        if (this.session === null) {
            await this.createSession()
        }
        if (this.session !== null) {
            let sql = `proc sql; create view promptValues as select distinct ${columnName} from ${libraryName}.${tableName};quit;`
            if (filters) {
                const whereClause = this.buildWhereClause(filters)
                sql = `proc sql; create view promptValues as select distinct ${columnName} from ${libraryName}.${tableName} where ${whereClause};quit;`
            }
            const code = [
                sql,
                'filename json temp;',
                'proc json out=json pretty nokeys nosastags; export promptValues ; run;',
            ]
            return await this.executeCode({ code: code, resultName: 'json' })
        }
    }

    executeCode = async ({ code, resultName }: ExecuteCodeProps) => {
        if (this.session === null) {
            await this.createSession()
        }
        if (this.session !== null) {
            const link = {
                method: 'POST',
                rel: 'self',
                href: `/compute/sessions/${this.session.id}/jobs`,
                type: 'application/vnd.sas.compute.job.request+json',
            } as Link
            const call = new APICall({ baseURL: this.baseURL, link: link, data: { code: code } })
            const response = await call.execute()
            if (response) {
                const job = response.data as ComputeServerJob
                let state = job.state
                while (state === 'pending') {
                    state = await this.checkJobState({ job: job })
                }
                if (state === 'completed') {
                    return this.getJobResult({ job: job, resultName: resultName })
                }
            }
        }
    }

    private readonly checkJobState = async ({ job }: CheckJobStateProps) => {
        if (this.session !== null) {
            const link = this.findElement(job.links, 'state') as Link
            const call = new APICall({ baseURL: this.baseURL, link: link })
            const response = await call.execute()
            if (response) {
                return response.data
            }
        }
    }

    private readonly getJobResult = async ({ job, resultName }: GetJobResultProps) => {
        if (this.session !== null) {
            const link = this.findElement(job.links, 'results') as Link
            const call = new APICall({ baseURL: this.baseURL, link: link })
            const response = await call.execute()
            if (response) {
                const item = this.findElement(response.data.items, resultName) as Item
                const call = new APICall({ baseURL: this.baseURL, link: item.links[0] })
                const result = await call.execute()
                if (result) {
                    const link = this.findElement(result.data.links, 'content') as Link
                    const headers = new Headers()
                    headers.append('Accept', 'text/plain')
                    const call = new APICall({
                        baseURL: this.baseURL,
                        link: link,
                        headers: headers,
                    })
                    const response = await call.execute()
                    if (response) {
                        return response.data
                    }
                }
            }
        }
    }

    private readonly buildWhereClause = (filters: GetValuesProps['filters']) => {
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
            return whereClause
        }
    }
}
