import { Item } from '../types/APICall.types'

export type OutputType = 'data' | 'api'

export type GenerateOutputProps = {
    items: Item[]
    outputType?: OutputType
}
