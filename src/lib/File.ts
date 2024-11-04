import { Link } from './types/APICall.types'
import { APIElementProps } from './types/APIElement.types'
import { GetFileByIdProps, File as TFile } from './types/File.types'
import APICall from './utils/APICall'
import Item from './utils/APIElement'
import { findElement } from './utils/functions'

export default class File extends Item<TFile> {
    private constructor({ baseURL, info }: APIElementProps<TFile>) {
        super({ baseURL: baseURL, info: info })
    }
    static getFileById = async ({ baseURL, id }: GetFileByIdProps) => {
        const link = {
            method: 'GET',
            rel: 'self',
            href: `/files/files/${id}`,
            uri: `/files/files/${id}`,
            type: 'application/vnd.sas.file',
        } as Link
        const call = new APICall({ baseURL: baseURL, link: link })
        const response = await call.execute()
        if (response) {
            return new File({ baseURL: baseURL, info: response.data as TFile })
        }
    }
    getFileContent = async () => {
        const link = findElement(this.info.links, 'content') as Link
        const call = new APICall({ baseURL: this.baseURL, link: link })
        const response = await call.execute()
        if (response) {
            console.log(response.data)
        }
    }
}
