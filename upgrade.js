#! /usr/bin/env node
process.removeAllListeners('warning');
const path = require('path');
const packageJsonPath = path.join(__dirname, './package.json');
const packageJson = require(packageJsonPath);
const readline = require('readline');
const util = require('util');
const fs = require('fs');

async function main() {
  const data = await spawnChild(
    'npm',
    [ 'outdated', '--json' ],
    {
      shell: process.platform === 'win32'
    }
  );
  const candidates = JSON.parse(data);
  for await (const packageName of Object.keys(candidates)) {
    const versions = await getVersions(packageName);
    process.stdout.write(
      util.inspect(versions, {
        showHidden: false,
        depth: null,
        colors: true,
        maxArrayLength: null
      })
    );
    const packageJsonVersion = packageJson?.dependencies[packageName] || packageJson.devDependencies[packageName];
    if (!packageJsonVersion) {
      throw new Error(`${packageName} not exist 1`);
    }
    console.log('\n', packageName);
    console.log(candidates[packageName]);
    console.log(`Version in package.json: ${packageJsonVersion}`);
    const selectedVersion = await askVersion(packageName);
    if (packageJson?.dependencies[packageName]) {
      packageJson.dependencies[packageName] = selectedVersion;
    } else if (packageJson?.devDependencies[packageName]) {
      packageJson.devDependencies[packageName] = selectedVersion;
    } else {
      throw new Error(`${packageName} not exist 2`);
    }
  }
  const packageStr = JSON.stringify(packageJson, null, 2);
  fs.writeFileSync(packageJsonPath, packageStr);
}

main();

async function askVersion(packageName) {
  return new Promise((resolve) => {
    const readlineInterface = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    readlineInterface.question(`Which version should be for ${packageName}? `,
      function (version) {
        resolve(version);
        readlineInterface.close();
      }
    );
  })
}

async function getVersions(packageName) {
  const versions = await spawnChild(
    'npm',
    ['view', packageName, 'versions', '--json'],
    {
      shell: process.platform === 'win32'
    }
  );
  return JSON.parse(versions);
}

async function spawnChild(...spawnArgs) {
  const { spawn } = require('child_process');
  const child = spawn(...spawnArgs);

  let data = '';
  for await (const chunk of child.stdout) {
    data += chunk;
  }
  let error = "";
  for await (const chunk of child.stderr) {
    error += chunk;
  }
  // const exitCode = await new Promise( (resolve, reject) => {
  //   child.on('close', resolve);
  // });
  //
  // if (exitCode) {
  //   throw new Error( `subprocess error exit ${exitCode}, ${error}`);
  // }
  return data;
}
