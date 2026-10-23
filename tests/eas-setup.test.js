// The build and over-the-air update setup: the "preview" build recipe, its update channel, expo-updates,
// and that app.json has no repeated entries (a tool once wrote the permission lists twice).
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const read = (file) => JSON.parse(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'));
const eas = read('eas.json');
const app = read('app.json').expo;
const packages = read('package.json');

test('the preview build makes an APK you can install, for a few people, and listens to the "preview" channel', () => {
  const preview = eas.build.preview;
  assert.equal(preview.distribution, 'internal');
  assert.equal(preview.android.buildType, 'apk');
  assert.equal(preview.channel, 'preview', 'so that `eas update --branch preview` reaches it');
});

test('every build recipe has its own update channel', () => {
  for (const name of ['development', 'preview', 'production']) assert.equal(eas.build[name].channel, name, name);
});

test('expo-updates is installed and pointed at this Expo project', () => {
  assert.ok(packages.dependencies['expo-updates']);
  assert.match(app.updates.url, /^https:\/\/u\.expo\.dev\/[0-9a-f-]{36}$/);
  assert.equal(app.updates.url.split('/').pop(), app.extra.eas.projectId, 'the update address belongs to this project');
});

test('updates only reach builds with the same app version (safe for native changes)', () => {
  assert.deepStrictEqual(app.runtimeVersion, { policy: 'appVersion' });
  assert.ok(app.version, 'the app has a version number');
});

test('app.json lists have no repeated entries', () => {
  const lists = { permissions: app.android.permissions, blocked: app.android.blockedPermissions, backgroundModes: app.ios.infoPlist.UIBackgroundModes };
  for (const [name, list] of Object.entries(lists)) assert.deepStrictEqual(list, [...new Set(list)], name);
});
