# webpack-multitenancy-plugin

Dynamically replace modules by adding them in a subfolder with the same path. This package can be used with Vue, React, Angular or any system using Webpack.

## Install

```bash
yarn add -D @swoop-ltd/webpack-multitenancy-plugin

npm i -D @swoop-ltd/webpack-multitenancy-plugin
```

## Build or serve with Vue-cli

```bash
yarn build theme=test-theme
yarn serve theme=test-theme
```

```js
// vue.config.js
const WebpackMultitenancyPlugin = require('@swoop-ltd/webpack-multitenancy-plugin')

const args = process.argv.slice(3) // get argument passed

module.exports = {
  configureWebpack: {
    plugins: [
      WebpackMultitenancyPlugin({
        theme: args[0].split('=')[1] // test-theme
      })
    ],
  },
}
```

By default this will look in the `./themes/test-theme/` directory to find modules that should be replaced in `./src/`.
For example `./themes/test-them/views/Home.vue` will replace  `./themes/src/views/Home.vue`.

## Vue extend and include components

By extending components you will have access to any functionality of the parent component with the ability to override the template or certain other functionality.

```js
// vue.config.js
const WebpackMultitenancyPlugin = require('@swoop-ltd/webpack-multitenancy-plugin')

const args = process.argv.slice(3) // get argument passed

module.exports = {
  configureWebpack: {
    resolve: {
      alias: {
        '@extend': resolve(__dirname, '.tmp/extend/'),
        '@include': resolve(__dirname, '.tmp/include/'),
      }
    },
    plugins: [
      WebpackMultitenancyPlugin({
        theme: args[0].split('=')[1] // test-theme
      })
    ],
  },
}
```

```vue
<script>
// /themes/test-theme/components/header-nav.vue
import HeaderNav from '@extend/components/header-nav'
import Avatar from '@extend/components/avatar'

export default {
  mixins: [HeaderNav],
  components: {
    Avatar,
  },
  methods: {
    login() {
      // change the login function from HeaderNav
    }
  }
}

</script>
```

```html
  <!-- /themes/test-theme/components/header-nav.vue -->
  <template>
    <!-- change the HeaderNav template -->
    <nav>
      <p>Welcome {{ username }}</p> <!-- data and methods from the HeaderNav is still available and reactive -->
      <Avatar />
      <button @click="login">login<button> <!-- call our new method -->
      <button @click="logout">logout<button> <!-- call the HeaderNav method -->
    </nav>
  </template>
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

## Caveat

When adding new files to the Webpack module tree that's unlinked, save the originally linked file.
