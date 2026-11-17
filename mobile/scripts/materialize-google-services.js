#!/usr/bin/env node
/**
 * Writes mobile/google-services.json for the Android release APK.
 *
 * Sources (first match wins):
 * 1. GOOGLE_SERVICES_JSON — raw JSON or base64-encoded JSON (ADO library / pipeline secret)
 * 2. GOOGLE_SERVICES_JSON_PATH — path to an existing file
 * 3. Existing mobile/google-services.json (already on disk)
 *
 * Expo / FCM: android.googleServicesFile in app.json points here; Gradle Google Services
 * plugin is applied when this file exists.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dest = path.join(root, 'google-services.json');
const androidDest = path.join(root, 'android', 'app', 'google-services.json');

function looksLikeJson(text) {
  const t = text.trim();
  return t.startsWith('{') && t.includes('project_info');
}

function decodePayload(raw) {
  const trimmed = raw.trim();
  if (looksLikeJson(trimmed)) {
    return trimmed;
  }
  try {
    const decoded = Buffer.from(trimmed, 'base64').toString('utf8').trim();
    if (looksLikeJson(decoded)) {
      return decoded;
    }
  } catch {
    // not base64
  }
  throw new Error(
    'GOOGLE_SERVICES_JSON is set but is neither google-services JSON nor base64 of that JSON.'
  );
}

function writeBoth(contents) {
  // Validate JSON shape lightly
  const parsed = JSON.parse(contents);
  const packageName =
    parsed?.client?.[0]?.client_info?.android_client_info?.package_name ||
    '(unknown)';
  fs.writeFileSync(dest, contents.endsWith('\n') ? contents : `${contents}\n`, 'utf8');
  fs.mkdirSync(path.dirname(androidDest), { recursive: true });
  fs.copyFileSync(dest, androidDest);
  console.log(
    `google-services.json ready (package ${packageName}) → ${path.relative(root, dest)} and android/app/`
  );
}

function main() {
  const fromEnv = (process.env.GOOGLE_SERVICES_JSON || '').trim();
  if (fromEnv) {
    writeBoth(decodePayload(fromEnv));
    return;
  }

  const fromPath = (process.env.GOOGLE_SERVICES_JSON_PATH || '').trim();
  if (fromPath) {
    const abs = path.resolve(fromPath);
    if (!fs.existsSync(abs)) {
      throw new Error(`GOOGLE_SERVICES_JSON_PATH not found: ${abs}`);
    }
    writeBoth(fs.readFileSync(abs, 'utf8'));
    return;
  }

  if (fs.existsSync(dest)) {
    writeBoth(fs.readFileSync(dest, 'utf8'));
    return;
  }

  console.error(
    [
      '##[warning]google-services.json is missing.',
      'Android Expo push tokens require Firebase FCM client config in the APK.',
      'Set ADO variable GOOGLE_SERVICES_JSON (raw or base64) in POS-Secrets, then re-run MobileBuild.',
      'Also upload the FCM V1 service account to Expo (eas credentials / FCM_SERVICE_ACCOUNT_JSON) so Expo can deliver pushes.',
      'Release keystore SHA-1 for Firebase: 4A:A1:B3:4F:3C:B6:F4:F3:96:77:E2:D4:42:3B:78:AB:1D:EB:8B:4A',
      'Continuing the APK build without FCM — getExpoPushTokenAsync will fail on device until this is set.',
    ].join('\n')
  );
  process.exit(0);
}

main();
