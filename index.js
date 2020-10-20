const { parse } = require('dotenv');
const webpack = require("webpack");
const path = require("path");
const fs = require("fs");

const rootPath = process.cwd();
const tempDir = ".tmp";
const extendDir = "extend";
const includeDir = "include";

const tempPath = `${rootPath}/${tempDir}/`;
const extendPath = `${tempPath}${extendDir}/`;
const includePath = `${tempPath}${includeDir}/`;


function injectMultiTenantEnvironment(tenantPath) {
  const envPath = fs.existsSync(tenantPath);
  const envFile =
    process.env.NODE_ENV === "development"
      ? ".env.local"
      : `.env.${process.env.NODE_ENV}`;

  const tenantDefaultEnvPath = `.${tenantPath}.env`;
  const tenantEnvPath = `.${tenantPath}${envFile}`;

  let env = {};
  if (fs.existsSync(tenantDefaultEnvPath)) {
    env = {
      ...parse(fs.readFileSync(tenantDefaultEnvPath, 'utf8'))
    };
  }
  if (fs.existsSync(tenantEnvPath)) {
    env = {
      ...env,
      ...parse(fs.readFileSync(tenantEnvPath, 'utf8'))
    };
  }

  process.env = {
    ...process.env,
    ...env,
  };
}

function checkForModuleReplacement(path, excludedPaths) {
  if (!path || !Array.isArray(excludedPaths)) {
    return false;
  }
  excludedPaths.push("/node_modules/");
  for (let i = 0; i < excludedPaths.length; i++) {
    if (path.includes(excludedPaths[i])) {
      return false;
    }
  }
  return true;
}

function runSetup({ srcPath, tenantPath, tenant }) {
  if (!fs.existsSync(tempPath)) {
    fs.mkdirSync(tempPath);
    fs.mkdirSync(extendPath);
    fs.symlinkSync(`${rootPath}${srcPath}`, `${tempDir}/${includeDir}`, "dir");
  }

  if (tenant) {
    if (!fs.existsSync(`${rootPath}${tenantPath}`)) {
      throw new Error(`Tenant does not exist at path ${rootPath}${tenantPath}`);
    }
    process.env = {
      ...process.env,
      VUE_APP_TENANT: tenant,
    };
  }
}

function cleanDirectoryRecursive(path) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach(function (file) {
      const curPath = `${path}/${file}`;
      if (fs.lstatSync(curPath).isDirectory()) {
        cleanDirectoryRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
}

module.exports = function multiTenantPlugin({
  tenant,
  tenantDir = "tenants",
  srcDir = "src",
  beforeRun,
  injectEnvironment = true,
  excludeDirs = [],
} = {}) {
  const tenantPath = tenant ? `/${tenantDir}/${tenant}/` : `/${tenantDir}/`;
  const srcPath = `/${srcDir}/`;
  const srcRegexPath = new RegExp(`(${srcPath})`);

  runSetup({ srcPath, tenant, tenantPath });

  if (injectEnvironment) {
    injectMultiTenantEnvironment(tenantPath);
  }

  if (typeof beforeRun === "function") {
    beforeRun();
  }

  return new webpack.NormalModuleReplacementPlugin(srcRegexPath, function (
    resource
  ) {
    if (checkForModuleReplacement(resource.userRequest, excludeDirs)) {
      const tenantResourcePath = resource.userRequest.replace(
        srcRegexPath,
        tenantPath
      );
      let filePath = "";
      let resourcePath = "";
      let replace = false;
      // if file exists in tenant use that path
      if (tenant && fs.existsSync(tenantResourcePath)) {
        filePath = tenantPath;
        resourcePath = tenantResourcePath;
        replace = true;
      }
      // if replacement is needed replace
      if (replace) {
        fs.mkdirSync(
          `.tmp/extend${path
            .dirname(resource.userRequest.replace(rootPath, ""))
            .replace(__dirname, "")
            .replace(srcPath.replace(/\//g, ""), "")}`,
          { recursive: true },
          (err) => {
            if (err) throw err;
          }
        );

        fs.copyFileSync(
          resource.userRequest,
          `.tmp/extend${path
            .dirname(resource.userRequest.replace(rootPath, ""))
            .replace(__dirname, "")
            .replace(srcPath.replace(/\//g, ""), "")}/${path.basename(
            resource.userRequest
          )}`
        );

        resource.request = resource.request.replace(srcRegexPath, filePath);
        resource.resource = resourcePath;
      }
    }
  });
};
