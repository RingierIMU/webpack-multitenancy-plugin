# webpack-multitenancy-plugin

Dynamically replace modules by adding them in a subfolder with the same path.

## Setup

```bash
yarn add -D @roamafrica/webpack-multitenancy-plugin

npm i -D @roamafrica/webpack-multitenancy-plugin
```

```js
const WebpackMultitenancyPlugin = require('@roamafrica/webpack-multitenancy-plugin')

module.exports = {
  configureWebpack: {
    plugins: [
      WebpackMultitenancyPlugin()
    ],
  },
}
```

## Options

```js
  WebpackMultitenancyPlugin({
    theme, // current theme directory name
    tenant, // current tenant directory name
    themeDir = 'themes', // the themes directory name
    tenantDir = 'tenants', // the tenants directory name
    srcDir = 'src', // your source directory
    beforeRun,  // function
    injectEnvironment = false, // inject environment from theme or tenent
    excludeDirs = [],  // any directories to exclude from replacement
  })
```
