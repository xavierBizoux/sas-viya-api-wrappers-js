import { Item } from './APICall.types'

export type File = Item & {
    creationTimestamp: string
    modifiedTimestamp: string
    parentUri: string
    properties: {}
    contentType: string
    encoding: string
    size: number
    searchable: boolean
    fileStatus: string
    fileVersion: number
    virusDetected: boolean
    urlDetected: boolean
    quarantine: boolean
}

export type GetFileByIdProps = {
    baseURL: string
    id: string
}
