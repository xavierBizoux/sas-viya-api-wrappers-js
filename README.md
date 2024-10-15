# SAS Viya API Wrappers for JavaScript

This repository contains JavaScript classes which can be used to interact with SAS Viya REST APIs.

Currently, the package contains wrapper for:

-   SAS Compute Server

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

This wrapper is created as a class. The cal can be instantiated using the following code:

```js
const api = new APICall({
    server: this.server,
    link: link,
    sasInstance: this.sasInstance,
    ...
})
```

The following parameters can be used to instantiate the class:

-   @param {APICallProps} options - Options to construct the APICall object.
-   @param {string} options.server - The SAS Viya server.
-   @param {Link} options.link - A link object that contains the method, rel, and other required information.
-   @param {CookieAuthenticationCredential} [options.sasInstance] - The authentication instance to use.
-   @param {Headers} [options.headers] - The headers to include in the request.
-   @param {string} [options.data] - The data to include in the request body.
-   @param {URLSearchParams} [options.urlSearchParams] - The URL search parameters to include in the request.

The class exposes the following methods:

-   execute()

### SAS Compute Server API

This wrapper is created as a class. The class can be instantiated using the following code:

```js
const computeSession = new ComputeSession(
    'https://server.demo.sas.com',
    'SAS Job Execution compute context'
)
```

The following parameters can be used to instantiate the class:

-   @param {string} server The URL of the SAS Viya server.
-   @param {string} [contextName='SAS Job Execution compute context'] The name of the context to use.
-   @param {CookieAuthenticationCredential} [sasInstance] The authentication instance to use.

The class exposes the following methods:

-   getComputeContexts()
-   getLibraries(
    outputType: OutputType = 'data'
    )
-   getTables(
    libraryName: string,
    outputType: OutputType = 'data'
    )
-   getColumns(
    libraryName: string,
    tableName: string,
    outputType: OutputType = 'data'
    )
-   getValues(
    libraryName: string,
    tableName: string,
    columnName: string,
    filters?: { column: string; value: string }[]
    )
-   executeCode(
    code: string[]
    )
-   deleteSession()
-   logout()

## Samples

In this section, you can find examples of web applications and their related code.

### SAS Compute Server API

-   [samples/js-job-simple](samples/js-job-simple): demonstrate how to create a simple prompt for a SAS Viya Job
-   [samples/js-job-simple](samples/js-job-avanced): demonstrate how to create a customized prompt for a SAS Viya Job
