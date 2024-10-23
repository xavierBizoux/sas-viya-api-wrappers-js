import { Item } from './APICall.types'

export type ComputeSession = Item & {
    applicationName: string
    attributes: { homeDirectory: string; sessionInactiveTimeout: number }
    owner: string
    serverId: string
    serviceAPIVersion: number
    state: string
    stateElapsedTime: number
}

export type ComputeSessionProps = {
    baseURL: string
    contextName?: string
}

export type ComputeContext = Item

export type ComputeServerLibrary = Item & {
    concatenationCount: number
    concatenations: { engineName: string; fileFormat: string; physicalName: string }[]
    engineName: string
    fileFormat: string
    flags: number
    libref: string
    physicalName: string
    readonly: boolean
}

export type ComputeServerTable = Item & {
    bookmarkLength: number
    columnCount: number
    compressionRoutine: string
    encoding: string
    engine: string
    extendedType: string
    label: string
    libref: string
    logicalRecordCount: number
    physicalRecordCount: number
    recordLength: number
    rowCount: number
}

export type ComputeServerColumn = Item & {
    index: number
    label: string
    length: number
}

export type ComputeServerJob = Item & {
    creationTimestamp: string
    sessionId: string
    state: string
    stateElapsedTime: number
}

export type OutputType = 'data' | 'api'

export type GenerateOutputProps = {
    items: Item[]
    outputType?: OutputType
}

export type GetLibrariesProps = {
    outputType?: OutputType
    searchParams?: URLSearchParams
}
export type GetLibraryProps = {
    libraryName: string
    searchParams?: URLSearchParams
}

export type GetTablesProps = {
    libraryName: string
    outputType?: OutputType
    searchParams?: URLSearchParams
}
export type GetTableProps = {
    libraryName: string
    tableName: string
    searchParams?: URLSearchParams
}
export type GetColumnsProps = {
    libraryName: string
    tableName: string
    outputType?: OutputType
    searchParams?: URLSearchParams
}
export type GetColumnProps = {
    libraryName: string
    tableName: string
    columnName: string
    searchParams?: URLSearchParams
}

export type GetValuesProps = {
    libraryName: string
    tableName: string
    columnName: string
    filters?: {
        column: string
        value: string
    }[]
}

export type ExecuteCodeProps = {
    code: string[]
    resultName: string
}

export type CheckJobStateProps = {
    job: ComputeServerJob
}

export type GetJobResultProps = {
    job: ComputeServerJob
    resultName: string
}
