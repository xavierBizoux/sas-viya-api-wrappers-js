import { Item, Link } from './APICall.types'

export type JobDefinition = Item & {
    code: string
    parameters: JobParameter[]
    properties: JobProperty[]
}

export type JobParameter = {
    version: number
    name: string
    defaultValue: string
    required: boolean
    type: 'CHARACTER' | 'DATE' | 'NUMERIC'
}

export type JobProperty = {
    name: string
    value: string
}

export type JobExecution = {
    createdBy: string
    creationTimeStamp: string
    elapsedTime: number
    heartbeatInterval: number
    heartbeatTimeStamp: string
    id: string
    jobRequest: JobRequest
    links: Link[]
    modifiedBy: string
    modifiedTimeStamp: string
    results: {}
    state: string
    submittedApplication: string
    version: number
}

export type JobRequest = {
    arguments: {}
    createdByApplication: string
    jobDefinition: JobDefinition
    jobDefinitionUri: string
    properties: {}[]
    version: number
}

export type InitProps = {
    baseURL: string
    path: string
    name: string
}

export type ExecuteJobProps = {
    data?: object
    args?: JobArgs
    resultFileName?: string | null
}

export type CheckJobStateProps = {
    job: JobExecution
}

export type GetJobResultProps = {
    job: JobExecution
    resultFileName?: string | null
}

export type CheckJobParametersProps = {
    args: JobArgs
}

export type JobArgs = {
    [key: string]: string | number
}
