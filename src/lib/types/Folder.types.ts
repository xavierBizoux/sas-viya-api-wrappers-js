import { Item } from './APICall.types'
export type Folder = Item & {
    memberCount: number
    parentFolderUri: string
    properties: {
        allowMove: string
        uuid: string
    }
}

export type GetFolderByNameProps = {
    baseURL: string
    name: string
    path?: string
}
