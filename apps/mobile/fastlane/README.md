fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

## iOS

### ios load_asc_api_key

```sh
[bundle exec] fastlane ios load_asc_api_key
```

Load App Store Connect API Key

### ios increment_build_number_lane

```sh
[bundle exec] fastlane ios increment_build_number_lane
```

Increment build number

### ios run_prebuild

```sh
[bundle exec] fastlane ios run_prebuild
```

Run Expo Prebuild for iOS

### ios build_upload_testflight

```sh
[bundle exec] fastlane ios build_upload_testflight
```

Build and upload to TestFlight (Production)

### ios build_staging

```sh
[bundle exec] fastlane ios build_staging
```

Build for staging/preview (Ad Hoc)

----


## Android

### android increment_build_number_lane

```sh
[bundle exec] fastlane android increment_build_number_lane
```

Increment build number

### android run_prebuild

```sh
[bundle exec] fastlane android run_prebuild
```

Run Expo Prebuild for Android

### android build_upload_playstore

```sh
[bundle exec] fastlane android build_upload_playstore
```

Build and upload to Play Store (Internal Track)

### android build_apk

```sh
[bundle exec] fastlane android build_apk
```

Build APK for testing

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
