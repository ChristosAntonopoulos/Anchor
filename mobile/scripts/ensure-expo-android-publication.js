'use strict';

/**
 * Gradle's Expo autolinking plugin deserializes each Android `publication`
 * with kotlinx.serialization. `version` is required. Some Expo packages
 * ship a publication object without it (or with SDK 55 `id`/`group` keys
 * instead of `groupId`/`artifactId`). Missing fields crash settings.gradle
 * at `expoAutolinking.useExpoModules()`.
 *
 * Fill gaps from the package's own version and emit both key shapes so
 * either decoder succeeds. Drop a publication that still has no version
 * so Gradle compiles that module from source instead of failing the build.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const MOBILE_ROOT = path.resolve(__dirname, '..');
const NODE_MODULES = path.join(MOBILE_ROOT, 'node_modules');

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function findExpoModuleConfigs(dir, results = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isFile() && (entry.name === 'expo-module.config.json' || entry.name === 'unimodule.json')) {
      results.push(full);
      continue;
    }
    if (entry.isDirectory() && entry.name !== '.git') {
      findExpoModuleConfigs(full, results);
    }
  }
  return results;
}

function packageVersionFor(configPath) {
  const pkgPath = path.join(path.dirname(configPath), 'package.json');
  if (!fs.existsSync(pkgPath)) {
    return null;
  }
  try {
    return readJson(pkgPath).version || null;
  } catch {
    return null;
  }
}

function normalizePublication(pub, pkgVersion) {
  if (!pub || typeof pub !== 'object' || Array.isArray(pub)) {
    return { publication: pub, changed: false, drop: false };
  }

  const next = { ...pub };
  let changed = false;

  if (!next.groupId && next.group) {
    next.groupId = next.group;
    changed = true;
  }
  if (!next.artifactId && next.id) {
    next.artifactId = next.id;
    changed = true;
  }
  if (!next.group && next.groupId) {
    next.group = next.groupId;
    changed = true;
  }
  if (!next.id && next.artifactId) {
    next.id = next.artifactId;
    changed = true;
  }
  if (!next.version && pkgVersion) {
    next.version = pkgVersion;
    changed = true;
  }
  if (!next.repository) {
    next.repository = 'local-maven-repo';
    changed = true;
  }

  if (!next.version) {
    return { publication: null, changed: true, drop: true };
  }

  return { publication: next, changed, drop: false };
}

function patchAndroidBlock(android, pkgVersion) {
  if (!android || typeof android !== 'object') {
    return { android, changed: false, dropped: 0 };
  }

  let changed = false;
  let dropped = 0;
  const next = { ...android };

  if (next.publication) {
    const result = normalizePublication(next.publication, pkgVersion);
    if (result.drop) {
      delete next.publication;
      changed = true;
      dropped += 1;
    } else if (result.changed) {
      next.publication = result.publication;
      changed = true;
    }
  }

  if (Array.isArray(next.projects)) {
    next.projects = next.projects.map((project) => {
      if (!project || typeof project !== 'object' || !project.publication) {
        return project;
      }
      const result = normalizePublication(project.publication, pkgVersion);
      if (result.drop) {
        const copy = { ...project };
        delete copy.publication;
        changed = true;
        dropped += 1;
        return copy;
      }
      if (result.changed) {
        changed = true;
        return { ...project, publication: result.publication };
      }
      return project;
    });
  }

  return { android: next, changed, dropped };
}

function patchConfigFile(configPath) {
  const pkgVersion = packageVersionFor(configPath);
  const raw = readJson(configPath);
  const patched = patchAndroidBlock(raw.android, pkgVersion);
  if (!patched.changed) {
    return { changed: false, dropped: 0 };
  }

  const next = { ...raw, android: patched.android };
  fs.writeFileSync(configPath, JSON.stringify(next, null, 2) + '\n');
  return { changed: true, dropped: patched.dropped, file: configPath };
}

function extractJson(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) {
    throw new Error('Autolinking did not print JSON.\n' + text.slice(0, 2000));
  }
  return JSON.parse(text.slice(start, end + 1));
}

function validateResolvedConfig() {
  const result = spawnSync(
    process.execPath,
    [
      '--no-warnings',
      '--eval',
      "require('expo/bin/autolinking')",
      'expo-modules-autolinking',
      'resolve',
      '--platform',
      'android',
      '--json',
    ],
    {
      cwd: MOBILE_ROOT,
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    }
  );

  if (result.status !== 0) {
    throw new Error(
      `expo-modules-autolinking resolve failed:\n${result.stderr || result.stdout || result.error}`
    );
  }

  const config = extractJson(result.stdout || '');
  const broken = [];
  for (const [index, mod] of (config.modules || []).entries()) {
    for (const [projectIndex, project] of (mod.projects || []).entries()) {
      const pub = project.publication;
      if (pub == null) {
        continue;
      }
      const version = pub.version;
      const groupId = pub.groupId || pub.group;
      const artifactId = pub.artifactId || pub.id;
      if (!version || !groupId || !artifactId) {
        broken.push({
          path: `$.modules[${index}].projects[${projectIndex}].publication`,
          packageName: mod.packageName,
          packageVersion: mod.packageVersion,
          project: project.name,
          publication: pub,
        });
      }
    }
  }

  if (broken.length) {
    throw new Error(
      'Android autolinking still has incomplete publication objects:\n' +
        JSON.stringify(broken, null, 2)
    );
  }

  return config.modules?.length || 0;
}

function main() {
  if (!fs.existsSync(NODE_MODULES)) {
    console.log('ensure-expo-android-publication: node_modules is missing, skipping.');
    return;
  }

  const configs = findExpoModuleConfigs(NODE_MODULES);
  let patched = 0;
  let dropped = 0;
  for (const configPath of configs) {
    const result = patchConfigFile(configPath);
    if (result.changed) {
      patched += 1;
      dropped += result.dropped;
      console.log(
        `ensure-expo-android-publication: patched ${path.relative(MOBILE_ROOT, configPath)}` +
          (result.dropped ? ` (dropped ${result.dropped} incomplete publication${result.dropped === 1 ? '' : 's'})` : '')
      );
    }
  }

  const moduleCount = validateResolvedConfig();
  console.log(
    `ensure-expo-android-publication: ${configs.length} module configs, ${patched} patched, ${dropped} publications dropped, ${moduleCount} Android modules resolved.`
  );
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
