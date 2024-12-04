import File from './File'
import Folder from './Folder'
import { Link, Item as TItem } from './types/APICall.types'
import { APIElementProps } from './types/APIElement.types'
import {
    CheckJobParametersProps,
    CheckJobStateProps,
    ExecuteJobProps,
    GetJobResultProps,
    InitProps,
    JobExecution,
    JobDefinition as TJob,
} from './types/Job.types'
import APICall from './utils/APICall'
import Item from './utils/APIElement'
import { delay, findElement } from './utils/functions'

export default class Job extends Item<TJob> {
    private constructor({ baseURL, info }: APIElementProps<TJob>) {
        super({ baseURL: baseURL, info: info })
    }

    static init = async ({ baseURL, name, path }: InitProps) => {
        const folder = await Folder.getFolderByName({
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

    execute = async ({ args, checkDelay, checkInterval, resultFileName }: ExecuteJobProps) => {
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
            if (checkDelay) {
                await delay(checkDelay * 1000)
            }
            while (['pending', 'running'].includes(state)) {
                state = await this.checkJobState({ jobExecution })
                if (checkInterval) {
                    await delay(checkInterval * 1000)
                }
            }
            if (state === 'completed') {
                if (resultFileName) {
                    return await this.getJobResult({
                        jobExecution: jobExecution,
                        resultFileName: resultFileName,
                    })
                } else {
                    return jobExecution
                }
            }
        }
    }

    private readonly checkJobState = async ({ jobExecution }: CheckJobStateProps) => {
        const link = findElement(jobExecution.links, 'state') as Link
        const headers = new Headers()
        headers.set('Accept', 'text/plain')
        const call = new APICall({ baseURL: this.baseURL, link: link, headers: headers })
        const response = await call.execute()
        if (response) {
            return response.data
        }
    }

    readonly getJobResult = async ({ jobExecution, resultFileName }: GetJobResultProps) => {
        const link = findElement(jobExecution.links, 'self') as Link
        const call = new APICall({ baseURL: this.baseURL, link: link })
        const response = await call.execute()
        if (response && resultFileName) {
            const resultKey = Object.keys(response.data.results).find(
                (key) => key === resultFileName
            )
            if (resultKey) {
                const id = response.data.results[resultKey].split('/').pop()!
                const file = await File.getFileById({ baseURL: this.baseURL, id: id })
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
