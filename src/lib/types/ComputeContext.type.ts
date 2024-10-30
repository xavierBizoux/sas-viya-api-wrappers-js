import { Item } from './APICall.types'

export type ComputeContext = Item & {
    launchContext: { contextName: string }
    launchType: string
}

export type GetComputeContextsProps = {
    baseURL: string
}
export type GetComputeContextProps = {
    baseURL: string
    contextName: string
}
