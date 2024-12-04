import { Item } from '../types/APICall.types'
import { GenerateOutputProps } from '../types/functions.types'

export const findElement = <T extends {}>(elements: T[], value: string): T => {
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

export const generateOutput = ({ items, outputType = 'api' }: GenerateOutputProps) => {
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

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
