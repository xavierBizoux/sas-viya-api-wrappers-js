import { ItemProps } from '../types/Item.types'

export default class Item<T> {
    info = {} as T
    baseURL: string
    constructor({ baseURL, info }: ItemProps<T>) {
        this.baseURL = baseURL
        this.info = info
    }
}
