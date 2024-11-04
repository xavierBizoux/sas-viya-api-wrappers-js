import { Link } from './types/APICall.types'
import { APIElementProps } from './types/APIElement.types'
import {
    GetComputeContextProps,
    GetComputeContextsProps,
    ComputeContext as TComputeContext,
} from './types/ComputeContext.type'
import APICall from './utils/APICall'
import Item from './utils/APIElement'
import { findElement, generateOutput } from './utils/functions'

export default class ComputeContext extends Item<TComputeContext> {
    private constructor({ baseURL, info }: APIElementProps<TComputeContext>) {
        super({ baseURL: baseURL, info: info })
    }
    static getComputeContextByName = async ({ baseURL, contextName }: GetComputeContextProps) => {
        const link: Link = {
            method: 'GET',
            rel: 'self',
            uri: `/compute/contexts`,
            href: `/compute/contexts`,
            type: 'application/vnd.sas.collection',
        }
        const call = new APICall({ baseURL: baseURL, link: link })
        const response = await call.execute()
        if (response && response.data.items) {
            const items = response.data.items as TComputeContext[]
            const context = findElement(items, contextName) as TComputeContext
            return new ComputeContext({ baseURL: baseURL, info: context })
        } else {
            throw new Error(`Compute context ${contextName} not found`)
        }
    }
}

export const getComputeContexts = async ({ baseURL }: GetComputeContextsProps) => {
    const link: Link = {
        method: 'GET',
        rel: 'self',
        uri: '/compute/contexts',
        href: '/compute/contexts',
    }
    const call = new APICall({ baseURL: baseURL, link: link })
    const response = await call.execute()
    if (response) {
        return generateOutput({ items: response.data.items, outputType: 'data' })
    }
}
