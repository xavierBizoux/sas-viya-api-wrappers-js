import { Link } from './types/APICall.types'
import { APIElementProps } from './types/APIElement.types'
import { GetFolderByNameProps, Folder as TFolder } from './types/Folder.types'
import APICall from './utils/APICall'
import Item from './utils/APIElement'
import { findElement } from './utils/functions'

export default class Folder extends Item<TFolder> {
    private constructor({ baseURL, info }: APIElementProps<TFolder>) {
        super({ baseURL: baseURL, info: info })
    }

    static getFolderByName = async ({
        baseURL,
        path,
        name,
    }: GetFolderByNameProps): Promise<Folder | undefined> => {
        const link: Link = {
            method: 'GET',
            rel: 'collection',
            href: '/folders/folders/@item',
            uri: '/folders/folders/@item',
            type: 'application/vnd.sas.collection',
        }
        const searchParams = new URLSearchParams()
        if (path) {
            searchParams.set('path', `${path}/${name}`)
        } else {
            throw new Error('Path is required')
        }
        const call = new APICall({ baseURL: baseURL, link: link, searchParams: searchParams })
        const response = await call.execute()
        if (response) {
            return new Folder({ baseURL: baseURL, info: response.data as TFolder })
        }
    }

    getMembers = async () => {
        const link = findElement(this.info.links, 'members') as Link
        const call = new APICall({ baseURL: this.baseURL, link: link })
        const response = await call.execute()
        if (response) {
            return response.data
        }
    }
}
