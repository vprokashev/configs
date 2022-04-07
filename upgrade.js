const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');
const packageJson = require('./package.json');

const outdated = childProcess.spawn('npm', ['outdated', '--json']);
outdated.stdout.on('data', (data) => {
    const packageVersions = JSON.parse(data);
    Object.keys(packageVersions).forEach((packageName) => {
        const versions = packageVersions[packageName];
        if (packageJson.dependencies[packageName]) {
            packageJson.dependencies[packageName] = versions.latest;
        }
        if (packageJson.devDependencies[packageName]) {
            packageJson.devDependencies[packageName] = versions.latest;
        }
    });
    const packageStr = JSON.stringify(packageJson, null, 2);
    fs.writeFileSync(path.join(__dirname, 'package.json'), packageStr);
})
