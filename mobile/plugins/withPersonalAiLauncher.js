const { withAndroidManifest } = require('@expo/config-plugins');

function ensureUsesPermission(manifest, name) {
  if (!manifest.manifest['uses-permission']) manifest.manifest['uses-permission'] = [];
  const list = manifest.manifest['uses-permission'];
  if (list.some((item) => item.$?.['android:name'] === name)) return;
  list.push({ $: { 'android:name': name, 'tools:ignore': 'QueryAllPackagesPermission' } });
}

function ensurePackageQuery(manifest, pkg) {
  if (!manifest.manifest.queries) manifest.manifest.queries = [{}];
  const queries = manifest.manifest.queries[0];
  if (!queries.package) queries.package = [];
  if (queries.package.some((item) => item.$?.['android:name'] === pkg)) return;
  queries.package.push({ $: { 'android:name': pkg } });
}

function ensureHomeActivity(manifest) {
  const app = manifest.manifest.application?.[0];
  if (!app) return;
  if (!app.activity) app.activity = [];
  const exists = app.activity.some((item) => item.$?.['android:name'] === '.HomeActivity');
  if (exists) return;
  app.activity.unshift({
    $: {
      'android:name': '.HomeActivity',
      'android:exported': 'true',
      'android:launchMode': 'singleTask',
      'android:theme': '@style/LauncherTheme',
      'android:taskAffinity': 'com.pos.mobile.launcher',
      'android:screenOrientation': 'portrait',
    },
    'intent-filter': [
      {
        action: [{ $: { 'android:name': 'android.intent.action.MAIN' } }],
        category: [
          { $: { 'android:name': 'android.intent.category.HOME' } },
          { $: { 'android:name': 'android.intent.category.DEFAULT' } },
        ],
      },
    ],
  });
}

module.exports = function withPersonalAiLauncher(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    if (manifest && !manifest.$) manifest.$ = {};
    if (manifest && !manifest.$['xmlns:tools']) {
      manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }
    ensureUsesPermission(config.modResults, 'android.permission.QUERY_ALL_PACKAGES');
    ensurePackageQuery(config.modResults, 'com.openai.chatgpt');
    ensurePackageQuery(config.modResults, 'com.google.android.apps.walletnfcrel');
    ensurePackageQuery(config.modResults, 'com.spotify.music');
    ensurePackageQuery(config.modResults, 'com.spotify.lite');
    ensurePackageQuery(config.modResults, 'com.anysphere.cursor');
    ensureHomeActivity(config.modResults);
    return config;
  });
};
