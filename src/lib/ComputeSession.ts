import { Link } from './types/APICall.types'
import APICall from './utils/APICall'
import { findElement, generateOutput } from './utils/functions'

import ComputeContext from './ComputeContext'
import {
    CheckComputeJobStateProps,
    ComputeServerColumn,
    ComputeServerJob,
    ComputeServerLibrary,
    ComputeServerResultFile,
    ComputeServerTable,
    ComputeSessionProps,
    DeleteSessionProps,
    ExecuteCodeProps,
    GetColumnProps,
    GetColumnsProps,
    GetJobResultProps,
    GetLibrariesProps,
    GetLibraryProps,
    GetTableProps,
    GetTablesProps,
    GetValuesProps,
    InitComputeSessionProps,
    ComputeSession as TComputeSession,
} from './types/ComputeSession.types'
import Item from './utils/APIElement'

export default class ComputeSession extends Item<TComputeSession> {
    private constructor({ baseURL, info }: ComputeSessionProps) {
        super({ baseURL: baseURL, info: info })
    }

    static init = async ({
        baseURL,
        contextName = 'SAS Job Execution compute context',
    }: InitComputeSessionProps) => {
        const context = await ComputeContext.getComputeContextByName({
            baseURL: baseURL,
            contextName: contextName,
        })
        if (context) {
            const link = findElement(context.info.links, 'createSession') as Link
            const call = new APICall({ baseURL: baseURL, link: link })
            const response = await call.execute()
            if (response) {
                return new ComputeSession({
                    baseURL: baseURL,
                    info: response.data as TComputeSession,
                })
            }
        }
    }

    deleteSession = async ({ logout = false }: DeleteSessionProps) => {
        const links = this.info.links
        const link = findElement(this.info.links, 'delete') as Link
        const call = new APICall({ baseURL: this.baseURL, link: link })
        const response = await call.execute()
        if (response) {
            if (logout) {
                await call.logout()
            }
        }
    }

    getLibraries = async ({ outputType = 'data' }: GetLibrariesProps = {}) => {
        const link = findElement(this.info.links, 'librefs')
        const call = new APICall({ baseURL: this.baseURL, link: link })
        const response = await call.execute()
        if (response) {
            return generateOutput({ items: response.data.items, outputType: outputType })
        }
    }

    private readonly getLibrary = async ({ libraryName }: GetLibraryProps) => {
        const libraries = (await this.getLibraries({
            outputType: 'api',
        })) as ComputeServerLibrary[]
        const link = findElement(libraries, libraryName).links[0] as Link
        const call = new APICall({ baseURL: this.baseURL, link: link })
        const response = await call.execute()
        if (response && response.data) {
            return response.data as ComputeServerLibrary
        }
    }

    getTables = async ({ libraryName, outputType = 'data' }: GetTablesProps) => {
        const library = (await this.getLibrary({
            libraryName: libraryName,
        })) as ComputeServerLibrary
        if (library && library.links) {
            const link = findElement(library.links, 'tables') as Link
            const searchParams = new URLSearchParams({ limit: '1000' })
            const call = new APICall({
                baseURL: this.baseURL,
                link: link,
                searchParams: searchParams,
            })
            const response = await call.execute()
            if (response) {
                return generateOutput({
                    items: response.data.items,
                    outputType: outputType,
                })
            }
        }
    }

    private readonly getTable = async ({ libraryName, tableName }: GetTableProps) => {
        const tables = (await this.getTables({
            libraryName: libraryName,
            outputType: 'api',
        })) as ComputeServerTable[]
        if (tables) {
            const link = findElement(tables, tableName).links[0] as Link
            const call = new APICall({ baseURL: this.baseURL, link: link })
            const response = await call.execute()
            if (response) {
                return response.data as ComputeServerTable
            }
        }
    }

    getColumns = async ({ libraryName, tableName, outputType = 'data' }: GetColumnsProps) => {
        const table = (await this.getTable({
            libraryName: libraryName,
            tableName: tableName,
        })) as ComputeServerTable
        if (table && table.links) {
            const link = findElement(table.links, 'columns') as Link
            const call = new APICall({ baseURL: this.baseURL, link: link })
            const response = await call.execute()
            if (response) {
                return generateOutput({
                    items: response.data.items,
                    outputType: outputType,
                })
            }
        }
    }

    private readonly getColumn = async ({ libraryName, tableName, columnName }: GetColumnProps) => {
        const columns = (await this.getColumns({
            libraryName: libraryName,
            tableName: tableName,
            outputType: 'api',
        })) as ComputeServerColumn[]
        if (columns) {
            const link = findElement(columns, columnName).links[0] as Link
            const call = new APICall({ baseURL: this.baseURL, link: link })
            const response = await call.execute()
            if (response) {
                return response.data as ComputeServerColumn
            }
        }
    }
    getValues = async ({ libraryName, tableName, columnName, filters }: GetValuesProps) => {
        let sql = `proc sql; create view promptValues${columnName} as select distinct ${columnName} from ${libraryName}.${tableName};quit;`
        if (filters) {
            const whereClause = this.buildWhereClause(filters)
            sql = `proc sql; create view promptValues${columnName} as select distinct ${columnName} from ${libraryName}.${tableName} where ${whereClause};quit;`
        }
        const jsonFileName = 'json' + Math.floor(Math.random() * 1000000)
        const code = [
            sql,
            `filename ${jsonFileName} temp;`,
            `proc json out=${jsonFileName} pretty nokeys nosastags; export promptValues${columnName} ; run;`,
        ]
        return await this.executeCode({ code: code, resultName: `${jsonFileName}` })
    }

    executeCode = async ({ code, resultName, params }: ExecuteCodeProps) => {
        const link = {
            method: 'POST',
            rel: 'self',
            href: `/compute/sessions/${this.info.id}/jobs`,
            type: 'application/vnd.sas.compute.job.request+json',
        } as Link
        const call = new APICall({
            baseURL: this.baseURL,
            link: link,
            data: { code: code },
            searchParams: params || new URLSearchParams(),
        })
        const response = await call.execute()
        if (response) {
            const job = response.data as ComputeServerJob
            let state = job.state
            while (['pending', 'running'].includes(state)) {
                state = await this.checkJobState({ job: job })
            }
            if (state === 'completed') {
                return this.getJobResult({ job: job, resultName: resultName })
            }
        }
    }

    private readonly checkJobState = async ({ job }: CheckComputeJobStateProps) => {
        const link = findElement(job.links, 'state') as Link
        const call = new APICall({ baseURL: this.baseURL, link: link })
        const response = await call.execute()
        if (response) {
            return response.data
        }
    }

    private readonly getJobResult = async ({ job, resultName }: GetJobResultProps) => {
        const link = findElement(job.links, 'results') as Link
        const call = new APICall({ baseURL: this.baseURL, link: link })
        const response = await call.execute()
        if (response) {
            const item = findElement(response.data.items, resultName) as ComputeServerResultFile
            const call = new APICall({ baseURL: this.baseURL, link: item.links[0] })
            const result = await call.execute()
            if (result) {
                const link = findElement(result.data.links, 'content') as Link
                const headers = new Headers()
                headers.append('Accept', link.type || 'text/plain')
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
