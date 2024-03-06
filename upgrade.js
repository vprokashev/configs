#! /usr/bin/env node

const path = require('path');
const packageJsonPath = path.join(__dirname, './package.json');
const packageJson = require(packageJsonPath);
const fs = require('fs');

(async function () {
  const data = await spawnChild(
    'npm',
    [ 'outdated', '--json' ]
  );
  const candidates = JSON.parse(data);
  for (const packageName of Object.keys(candidates)) {
    const packageJsonVersion = packageJson?.dependencies[ packageName ] || packageJson.devDependencies[ packageName ];
    if (!packageJsonVersion) {
      throw new Error(`${ packageName } not exist 1`);
    }
    const selectedVersion = candidates[ packageName ].latest;
    if (packageJsonVersion !== selectedVersion) {
      console.log(`${ packageName } prev: ${ packageJsonVersion } next: ${ selectedVersion }`);
    }
    if (packageJson?.dependencies[ packageName ]) {
      packageJson.dependencies[ packageName ] = selectedVersion;
    } else if (packageJson?.devDependencies[ packageName ]) {
      packageJson.devDependencies[ packageName ] = selectedVersion;
    } else {
      throw new Error(`${ packageName } not exist 2`);
    }
  }
  const packageStr = JSON.stringify(packageJson, null, 2);
  fs.writeFileSync(packageJsonPath, packageStr);
}());

async function spawnChild(
  command,
  args,
  options = {
    shell: process.platform === 'win32',
    cwd: path.join(__dirname, './')
  }
) {
  const { spawn } = require('child_process');

  const child = spawn(command, args, options);

  let data = '';
  for await (const chunk of child.stdout) {
    // prevent output
    // process.stdout.write(chunk.toString());
    data += chunk;
  }

  let error = '';
  for await (const chunk of child.stderr) {
    error += chunk;
  }

  // BUG: "npm outdated" return code 1 due to warnings
  // const exitCode = await new Promise((resolve) => {
  //   child.on('close', (code) => {
  //     resolve(code);
  //   });
  // });
  //
  // if (exitCode !== 0) {
  //   throw new Error(`Child process exited with code ${ exitCode }\n${ error }`);
  // }

  return data;
}
