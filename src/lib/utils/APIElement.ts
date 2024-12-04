import { APIElementProps } from '../types/APIElement.types'

export default class APIElement<T> {
    info = {} as T
    baseURL: string
    constructor({ baseURL, info }: APIElementProps<T>) {
        this.baseURL = baseURL
        this.info = info
    }
}
