/**
 * Expo config plugin to restrict Android app to phones only (exclude tablets)
 * This adds <supports-screens> to AndroidManifest.xml to exclude tablets
 * from Google Play Store visibility.
 *
 * Screen sizes:
 * - small: ~320x426dp or smaller
 * - normal: ~320x470dp (typical phone)
 * - large: ~480x640dp (tablets)
 * - xlarge: ~720x960dp (large tablets)
 *
 * By setting largeScreens="false" and xlargeScreens="false", we exclude tablets.
 */
const { withAndroidManifest } = require('@expo/config-plugins')

/**
 * Add supports-screens element to restrict to phone screens only
 */
function addSupportsScreens(androidManifest) {
  const { manifest } = androidManifest

  // Add supports-screens configuration
  // This tells Google Play Store which screen sizes are supported
  manifest['supports-screens'] = [
    {
      $: {
        'android:smallScreens': 'true',
        'android:normalScreens': 'true',
        'android:largeScreens': 'false', // Exclude tablets (7" tablets)
        'android:xlargeScreens': 'false', // Exclude large tablets (10" tablets)
        'android:requiresSmallestWidthDp': '320', // Minimum width in dp
        'android:compatibleWidthLimitDp': '480', // Maximum compatible width (phones)
      },
    },
  ]

  return androidManifest
}

/**
 * Expo config plugin that modifies AndroidManifest.xml
 */
const withAndroidPhoneOnly = (config) => {
  return withAndroidManifest(config, (config) => {
    config.modResults = addSupportsScreens(config.modResults)
    return config
  })
}

module.exports = withAndroidPhoneOnly
