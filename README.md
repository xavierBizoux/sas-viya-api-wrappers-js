# SAS Viya API Wrappers for JavaScript

This repository contains JavaScript classes which can be used to interact with SAS Viya REST APIs.

Currently, the package contains wrapper for:

-   SAS Compute Server

The [sas-auth-browser](https://github.com/sassoftware/sas-viya-sdk-js/blob/main/sdk/sas-auth-browser/README.md) package provided by SAS. This packages requires specific configuration of the SAS Viya environment. Please refer to the [documentation](https://developers.sas.com/sdk/va/docs/latest/getting-started#sas-viya-setup) for more information.

## SAS Compute Server

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

## For more information about the usage, please refer to the following article(s):
