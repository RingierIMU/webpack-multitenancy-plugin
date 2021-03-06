const webpack = require('webpack')
const path = require('path')
const fs = require('fs')

const rootPath = process.cwd();
const tempDir = '.tmp'
const extendDir = 'extend'
const includeDir = 'include'

const tempPath = `${rootPath}/${tempDir}/`
const extendPath = `${tempPath}${extendDir}/`
const includePath = `${tempPath}${includeDir}/`

function injectMultiTenantEnvironment(themePath, tenantPath) {

  const envPath = fs.existsSync(tenantPath) ? tenantPath : themePath
  const envFile = process.env.NODE_ENV === 'development' ? '.env.local.json' : `.env.${process.env.NODE_ENV}.json`
  
  const themeEnvPath = `.${themePath}${envFile}`
  const tenantEnvPath = `.${tenantPath}${envFile}`

  let env = {}
  if (fs.existsSync(themeEnvPath)) {
    env = {
      ...require(`.${envPath}${envFile}`)
    }
  }

  if (fs.existsSync(tenantEnvPath)) {
    env = {
      ...env,
      ...require(`.${envPath}${envFile}`)
    }
  }

  process.env = {
    ...process.env,
    ...env
  }
}

function checkForModuleReplacement(path, excludedPaths) {
  if (!path || !Array.isArray(excludedPaths)) {
    return false
  }
  excludedPaths.push('/node_modules/')
  for (let i = 0; i < excludedPaths.length; i++) {
    if (path.includes(excludedPaths[i])) {
      return false
    }
  }
  return true
}

function runSetup({ srcPath, themePath, tenantPath, tenant }) {
  if (!fs.existsSync(tempPath)) {
    fs.mkdirSync(tempPath)
    fs.mkdirSync(extendPath)
    fs.symlinkSync(`${rootPath}${srcPath}`, `${tempDir}/${includeDir}`, 'dir')
  }

  if (!fs.existsSync(`${rootPath}${themePath}`)){
    fs.mkdirSync(`${rootPath}${themePath}`)

    if (tenant) {
      fs.mkdirSync(`${rootPath}${tenantPath}`)
    }
  }

  cleanDirectoryRecursive(extendPath)
}

function cleanDirectoryRecursive(path) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach(function(file) {
      const curPath = `${path}/${file}`
      if (fs.lstatSync(curPath).isDirectory()) {
        cleanDirectoryRecursive(curPath)
      } else {
        fs.unlinkSync(curPath)
      }
    })
    fs.rmdirSync(path)
  }
}

module.exports = function multiTenantPlugin(
  {
    tenant,
    theme,
    themeDir = 'themes',
    tenantDir = 'tenants',
    srcDir = 'src',
    beforeRun,
    injectEnvironment = false,
    excludeDirs = [],
  } = {}
) {
  const themePath = theme ? `/${themeDir}/${theme}/` : `/${themeDir}/`
  const tenantPath = tenant ? `${themePath}${tenantDir}/${tenant}/` : `${themePath}${tenantDir}/`
  const srcPath = `/${srcDir}/`
  const srcRegexPath = new RegExp(`(${srcPath})`)

  runSetup({ srcPath, tenant, themePath, tenantPath })

  if (injectEnvironment) {
    injectMultiTenantEnvironment(themePath, tenantPath)
  }

  if (typeof beforeRun === 'function') {
    beforeRun()
  }

  return new webpack.NormalModuleReplacementPlugin(srcRegexPath, function(resource) {
      if (checkForModuleReplacement(resource.userRequest, excludeDirs)) {
        const themeResourcePath = resource.userRequest.replace(
          srcRegexPath,
          themePath
        )
        const tenantResourcePath = resource.userRequest.replace(
          srcRegexPath,
          tenantPath
        )
        let filePath = ''
        let resourcePath = ''
        let replace = false
        // if file exists in tenant use that path
        if (tenant && fs.existsSync(tenantResourcePath)) {
          filePath = tenantPath
          resourcePath = tenantResourcePath
          replace = true
          // else if file exists in theme use that path
        } else if (fs.existsSync(themeResourcePath)) {
          filePath = themePath
          resourcePath = themeResourcePath
          replace = true
        }
        // if replacement is needed replace
        if (replace) {
          fs.mkdirSync(
            `.tmp/extend${path
              .dirname(resource.userRequest.replace(rootPath, ''))
              .replace(__dirname, '')
              .replace(srcPath.replace(/\//g, ''), '')}`,
            { recursive: true },
            (err) => {
              if (err) throw err
            }
          )

          fs.copyFileSync(
            resource.userRequest,
            `.tmp/extend${path
              .dirname(resource.userRequest.replace(rootPath, ''))
              .replace(__dirname, '')
              .replace(srcPath.replace(/\//g, ''), '')}/${path.basename(resource.userRequest)}`
          )

          resource.request = resource.request.replace(srcRegexPath, filePath)
          resource.resource = resourcePath
        }
      }
    })
}