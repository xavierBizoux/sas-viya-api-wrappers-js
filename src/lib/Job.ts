import { getFileById } from './File'
import { getFolderByName } from './Folder'
import { Link, Item as TItem } from './types/APICall.types'
import { ItemProps } from './types/Item.types'
import {
    CheckJobParametersProps,
    CheckJobStateProps,
    ExecuteJobProps,
    GetJobDefinitionProps,
    GetJobResultProps,
    JobExecution,
    JobDefinition as TJob,
} from './types/Job.types'
import APICall from './utils/APICall'
import { findElement } from './utils/functions'
import Item from './utils/Item'

export default class Job extends Item<TJob> {
    constructor({ baseURL, info }: ItemProps<TJob>) {
        super({ baseURL: baseURL, info: info })
    }

    getJobDefinition = () => {
        return this.info
    }

    getJobParameters = () => {
        return this.info.parameters
    }

    checkJobParameters = ({ args }: CheckJobParametersProps) => {
        const parameters = this.getJobParameters()
        const missingParameters = []
        if (parameters) {
            for (const parameter of parameters) {
                if (!(parameter.name in args) && parameter.required && !parameter.defaultValue) {
                    missingParameters.push(parameter)
                }
            }
        }
        if (missingParameters.length > 0) {
            console.log(missingParameters)
            throw new Error(`Missing parameters. Please check the console log.`)
        }
    }

    execute = async ({ args, resultFileName = null }: ExecuteJobProps) => {
        if (args) {
            this.checkJobParameters({ args: args })
        }
        const link = {
            method: 'POST',
            href: '/jobExecution/jobs',
            uri: '/jobExecution/jobs',
            type: 'application/vnd.sas.job.execution.job.request',
            rel: 'execute',
        } as Link
        const jobDefinitionUri = findElement(this.info.links, 'self') as Link
        const call = new APICall({
            baseURL: this.baseURL,
            link: link,
            data: {
                jobDefinitionUri: jobDefinitionUri.href,
                arguments: args,
            },
        })
        const response = await call.execute()
        if (response) {
            const jobExecution = response?.data as JobExecution
            let state = jobExecution.state
            while (['pending', 'running'].includes(state)) {
                state = await this.checkJobState({ job: jobExecution })
            }
            if (state === 'completed') {
                return await this.getJobResult({
                    job: jobExecution,
                    resultFileName: resultFileName,
                })
            }
        }
    }

    private readonly checkJobState = async ({ job }: CheckJobStateProps) => {
        const link = findElement(job.links, 'state') as Link
        const headers = new Headers()
        headers.set('Accept', 'text/plain')
        const call = new APICall({ baseURL: this.baseURL, link: link, headers: headers })
        const response = await call.execute()
        if (response) {
            return response.data
        }
    }

    private readonly getJobResult = async ({ job, resultFileName = null }: GetJobResultProps) => {
        const link = findElement(job.links, 'self') as Link
        const call = new APICall({ baseURL: this.baseURL, link: link })
        const response = await call.execute()
        if (response && resultFileName) {
            const resultKey = Object.keys(response.data.results).find(
                (key) => key === resultFileName
            )
            if (resultKey) {
                const id = response.data.results[resultKey].split('/').pop()!
                const file = await getFileById({ baseURL: this.baseURL, id: id })
                if (file) {
                    const link = findElement(file.info.links, 'content') as Link
                    const call = new APICall({ baseURL: this.baseURL, link: link })
                    const response = await call.execute()
                    if (response) {
                        return response.data
                    }
                }
            }
        }
        if (response) {
            return response.data.results
        }
    }
}

export const getJobDefinition = async ({ baseURL, name, path }: GetJobDefinitionProps) => {
    const folder = await getFolderByName({
        baseURL: baseURL,
        path: path.split('/').slice(0, -1).join('/'),
        name: path.split('/').slice(-1)[0],
    })
    if (folder) {
        const folderMembers = await folder.getMembers()
        if (folderMembers) {
            const member = findElement(folderMembers.items, name) as TItem
            const link = findElement(member.links, 'getResource') as Link
            const call = new APICall({
                baseURL: baseURL,
                link: link,
            })
            const response = await call.execute()
            if (response) {
                return new Job({ baseURL: baseURL, info: response.data })
            } else {
                throw new Error('Failed to get job definition')
            }
        }
    }
}
