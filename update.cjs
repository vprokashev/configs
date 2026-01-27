#! /usr/bin/env node

const path = require('path')
const fs = require('fs')

const packageJsonPath = path.join(__dirname, './package.json')
const packageJson = require(packageJsonPath)

;(async function () {
  const data = await spawnChild(getNpmCommand(), ['outdated', '--json'])
  const candidates = JSON.parse(data || '{}')

  for (const packageName of Object.keys(candidates)) {
    const packageJsonVersion =
      packageJson?.dependencies?.[packageName] ?? packageJson?.devDependencies?.[packageName]
    if (!packageJsonVersion) {
      throw new Error(`${packageName} not exist 1`)
    }

    const current = coerceSemver(packageJsonVersion)
    if (!current) {
      console.warn(`[skip] ${packageName}: cannot parse current version "${packageJsonVersion}"`)
      continue
    }

    // Pick the newest version within the same major (minor/patch only).
    const selected = await getLatestWithinMajor(packageName, current.major)
    if (!selected) {
      // no compatible updates found (or package has no semver versions)
      continue
    }

    if (compareSemver(selected, current) <= 0) {
      // already at newest within major
      continue
    }

    const selectedVersion = `${selected.major}.${selected.minor}.${selected.patch}`
    console.log(`${packageName} prev: ${packageJsonVersion} next: ${selectedVersion}`)

    if (packageJson?.dependencies?.[packageName]) {
      packageJson.dependencies[packageName] = selectedVersion
    } else if (packageJson?.devDependencies?.[packageName]) {
      packageJson.devDependencies[packageName] = selectedVersion
    } else {
      throw new Error(`${packageName} not exist 2`)
    }
  }

  const packageStr = JSON.stringify(packageJson, null, 2)
  fs.writeFileSync(packageJsonPath, packageStr)
})()

async function spawnChild(
  command,
  args,
  options = {
    shell: process.platform === 'win32',
    cwd: path.join(__dirname, './'),
  },
) {
  const { spawn } = require('child_process')

  const child = spawn(command, args, options)

  let data = ''
  for await (const chunk of child.stdout) {
    data += chunk
  }

  let error = ''
  for await (const chunk of child.stderr) {
    error += chunk
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

  if (error) {
    // keep behavior close to original: don't fail on stderr, but make it visible if needed
    // console.error(error)
  }

  return data
}

function getNpmCommand() {
  return 'npm'
}

function coerceSemver(input) {
  if (!input) return null
  const s = String(input).trim()
  // Accept pinned versions and common ranges (^, ~, >=, etc.) by extracting the first x.y.z
  const m = s.match(/(\d+)\.(\d+)\.(\d+)/)
  if (!m) return null
  return { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]) }
}

function compareSemver(a, b) {
  if (a.major !== b.major) return a.major - b.major
  if (a.minor !== b.minor) return a.minor - b.minor
  return a.patch - b.patch
}

async function getLatestWithinMajor(packageName, major) {
  const raw = await spawnChild(getNpmCommand(), ['view', packageName, 'versions', '--json'])
  let versions
  try {
    versions = JSON.parse(raw || '[]')
  } catch {
    console.warn(`[skip] ${packageName}: cannot parse "npm view versions" output`)
    return null
  }

  if (!Array.isArray(versions)) {
    return null
  }

  let best = null
  for (const v of versions) {
    // ignore prereleases by default (e.g. 1.2.3-beta.1)
    if (typeof v !== 'string' || v.includes('-')) continue
    const sv = coerceSemver(v)
    if (!sv) continue
    if (sv.major !== major) continue
    if (!best || compareSemver(sv, best) > 0) {
      best = sv
    }
  }
  return best
}

