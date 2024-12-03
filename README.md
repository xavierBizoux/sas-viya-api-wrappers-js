# SAS Viya API Wrappers for JavaScript

This repository contains JavaScript classes which can be used to interact with SAS Viya REST APIs.

Currently, the package contains wrapper for:

-   SAS Compute Server
-   SAS Job Execution

Other wrappers are also available, and are mainly used by the wrappers listed above.

-   SAS Content Server File
-   SAS Content Server Folder
-   SAS Compute Server Context

## Prerequisite

The [sas-auth-browser](https://github.com/sassoftware/sas-viya-sdk-js/blob/main/sdk/sas-auth-browser/README.md) package provided by SAS.

In order to successfully make browser based REST calls to SAS Viya endpoints using cookies, you will need to enable CORS, Cross-site cookies and CSRF web security settings. For more information, see the SAS® Visual Analytics SDK SAS Viya [setup guide](https://developer.sas.com/sdk/va/docs/guides/viya-setup/).

## Installation

```bash
npm i sas-viya-api-wrappers-js
```

## CDN

```html
<script type="importmap">
    {
        "imports": {
            "sas-viya-api-wrappers-js": "https://cdn.jsdelivr.net/npm/sas-viya-api-wrappers-js@latest/dist/sas-viya-api-wrappers-js.js"
        }
    }
</script>
```

## Usage

### API Calls

This wrapper is created as a class. The call can be instantiated using the following code:

```js
const api = new APICall({
    baseURL: this.server,
    link: link,
    data: data,
    searchParams: searchParams
    headers: headers
})
```

The following parameters can be used to instantiate the class:

-   baseURL: string
-   link: Link
-   data?: {}
-   searchParams?: URLSearchParams
-   headers?: Headers

The class exposes the following methods:

-   execute(): to call the API endpoint
-   logout(): to logout from the SAS server

### SAS Compute Server API

This wrapper is created as a class. The class can be instantiated using the following code:

```js
const computeSession = new ComputeSession.init({
    baseURL: 'https://server.demo.sas.com',
    contextName: 'SAS Job Execution compute context',
})
```

The following parameters should be used to instantiate the class:

-   baseURL: string
-   contextName?: string

The class exposes the following methods:

-   static init(
    baseURL: string,
    contextName: string
    )
-   getLibraries(
    outputType?: OutputType
    searchParams?: URLSearchParams
    )
-   getTables(
    libraryName: string
    outputType?: OutputType
    searchParams?: URLSearchParams
    )
-   getColumns(
    libraryName: string
    tableName: string
    outputType?: OutputType
    searchParams?: URLSearchParams
    )
-   getValues(
    libraryName: string
    tableName: string
    columnName: string
    filters?: {
    column: string
    value: string
    }[]
    )
-   executeCode(
    code: string | string[]
    resultName: string
    )
-   deleteSession(
    logout: boolean
    )

### SAS Job Execution API

This wrapper is created as a class. The class can be instantiated using the following code:

```js
const job = new Job.init({
    baseURL: 'https://server.demo.sas.com',
    name: 'Test',
    path: '/Users/student/My Folder',
})
```

**Note**: The code of the job should include %JESBEGIN and %JESEND macro variables if you want to use the \_webout destination for the output of your job.

The following parameters should be used to instantiate the class:

-   baseURL: string
-   name: string
-   path: string

The class exposes the following methods:

-   static init(
    baseURL: string,
    name: string,
    path: string
    )
-   getJobDefinition()
-   getJobParameters()
-   checkJobParameters(
    args: [key: string]: string | number
    )
-   execute(
    args [key: string]: string | number
    resultFileName?: string
    )

## Samples

In this section, you can find examples of web applications and their related code.

### SAS Compute Server API

-   [samples/js-job-simple](samples/js-job-simple): demonstrate how to create a simple prompt for a SAS Viya Job
-   [samples/js-job-simple](samples/js-job-avanced): demonstrate how to create a customized prompt for a SAS Viya Job
