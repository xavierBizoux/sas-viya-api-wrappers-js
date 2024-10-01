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

### SAS Compute Server API

This wrapper is created as a class. The class can be instantiated using the following code:

```js
const computeSession = new ComputeSession(
    'https://server.demo.sas.com',
    'SAS Job Execution compute context'
)
```

The first parameter is the SAS Viya server name.
The second parameters corresponds to the server context you want to access.

The class exposes the following functions:

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
