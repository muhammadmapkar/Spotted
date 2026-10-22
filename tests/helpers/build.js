// Step 1 of `npm test`: turns the TypeScript files the tests need into plain JavaScript
// (in the .test-build/ folder), so Node can run them. Nothing here changes your app.

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..', '..');
const outDir = path.join(root, '.test-build');

// The tests start from these files. The compiler follows their imports automatically.
const entryFiles = [
  'src/db/index.ts',
  'src/geofence/rules.ts',
  'src/geofence/sync.ts',
  'src/geofence/tasks.ts',
  'src/geofence/GeofenceManager.tsx',
  'src/permissions/index.ts',
  'src/geofence/catalogue.ts',
  'src/alerts/links.ts',
  'src/alerts/bannerStore.ts',
  'src/alerts/enableAlerts.ts',
  'src/components/alerts/AlertBanner.tsx',
  'app/permissions.tsx',
  'src/location/distance.ts',
  'src/places/search.ts',
  'src/places/clues.ts',
  'src/places/fromCaption.ts',
  'src/share/links.ts',
  'src/share/ShareIntentHandler.tsx',
  'src/settings/time.ts',
  'src/placeFilters.ts',
  'app/(tabs)/map.tsx',
  'app/(tabs)/new.tsx',
  'app/(tabs)/profile.tsx',
  'src/profile/profileData.ts',
  'src/profile/useCountUp.ts',
  'src/components/profile/SavingsCard.tsx',
  'src/components/profile/LoyaltyCardView.tsx',
  'src/components/profile/ToggleRow.tsx',
  'src/components/influencer/ProfileRing.tsx',
  'app/reel-map.tsx',
  'src/map/mapData.ts',
  'src/map/mapStyle.ts',
  'src/components/map/PinShape.tsx',
  'src/components/map/UserDot.tsx',
  'src/components/map/MapHeader.tsx',
  'src/components/map/MapPlaceCard.tsx',
  'src/components/map/RealMap.tsx',
  'src/components/map/SketchMap.tsx',
  'src/newin/newInData.ts',
  'src/components/NewBadge.tsx',
  'src/components/newin/OfferCard.tsx',
  'src/components/newin/NewInfluencerCircle.tsx',
  'src/components/PlaceInfoCard.tsx',
  'src/components/home/InfluencerCard.tsx',
  'src/components/place/OffersList.tsx',
  'constants/Theme.ts',
  'src/theme/fonts.ts',
  'src/theme/ThemeProvider.tsx',
  'src/data/mock.ts',
  'src/components/icons/paths.ts',
  'src/splash/timeline.ts',
  'src/splash/AnimatedSplash.tsx',
  'src/auth/phone.ts',
  'src/auth/forms.ts',
  'src/auth/useSignInFlow.ts',
  'src/services/auth.ts',
  'src/auth/stage.ts',
  'src/components/tabBarConfig.ts',
  'src/components/tabBarMath.ts',
  'src/state/newIn.ts',
  'src/state/saved.ts',
  'src/state/filters.ts',
  'src/home/homeData.ts',
  'src/home/typing.ts',
  'src/location/area.ts',
  'src/home/useTypingPlaceholder.ts',
  'app/(tabs)/index.tsx',
  'src/place/placeData.ts',
  'app/venue/[id].tsx',
  'src/components/place/MenuSheet.tsx',
  'src/components/place/Dropdown.tsx',
  'src/components/place/PlaceHero.tsx',
  'src/components/place/ActionRow.tsx',
  'src/components/place/InfluencerRecs.tsx',
  'src/components/place/OffersList.tsx',
  'src/components/place/ShopFront.tsx',
  'src/influencer/influencerData.ts',
  'app/influencer/[id].tsx',
  'src/components/influencer/ProfileRing.tsx',
  'src/components/influencer/PlatformTile.tsx',
  'src/components/influencer/TopCard.tsx',
  'src/components/influencer/RecommendationRow.tsx',
  'src/components/motion.ts',
  'src/components/filters/FilterSheet.tsx',
  'src/services/savedPlaces.ts',
  'src/saved/savedData.ts',
  'app/(tabs)/saved.tsx',
  'src/components/saved/FolderTile.tsx',
];

fs.rmSync(outDir, { recursive: true, force: true });

const tsc = path.join(root, 'node_modules', 'typescript', 'bin', 'tsc');
const result = spawnSync(
  process.execPath,
  [
    tsc,
    ...entryFiles,
    '--ignoreConfig',
    '--outDir', outDir,
    '--rootDir', root,
    '--module', 'commonjs',
    '--target', 'es2020',
    '--moduleResolution', 'node',
    '--ignoreDeprecations', '6.0',
    '--skipLibCheck',
    '--esModuleInterop',
    '--jsx', 'react-jsx',
  ],
  { cwd: root, encoding: 'utf8' }
);

// The compiler may complain about "@/..." shortcuts in a few files (the real type-check is
// `npm run typecheck`). That is fine here. What matters is that the JavaScript was written.
const missing = entryFiles.filter((file) => !fs.existsSync(path.join(outDir, file.replace(/\.tsx?$/, '.js'))));
if (missing.length > 0) {
  console.error('Could not prepare the tests. These files were not built:\n  ' + missing.join('\n  '));
  console.error(result.stdout || result.stderr);
  process.exit(1);
}
console.log(`Prepared ${entryFiles.length} files for testing in .test-build/`);
