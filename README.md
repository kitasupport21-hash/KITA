# OfflineVault

An Android Flutter app that downloads web pages for later offline reading.

## GitHub build and APK

This project lives on the `offlinevault` branch of the connected repository. GitHub Actions runs on every push to this branch and can also be started manually from **Actions → OfflineVault Android APK → Run workflow**.

The workflow:
1. Creates a fresh Android Flutter project with the current stable Flutter SDK.
2. Extracts `OfflineVault_Source.tar.xz` and copies the app source into the Flutter project.
3. Runs `flutter pub get` and `flutter analyze`.
4. Builds a release APK.
5. Uploads `OfflineVault-release.apk` as a workflow artifact and publishes a GitHub Release.

Download the latest APK from the repository's **Releases** page after the workflow finishes successfully.

## Setup locally

Install Flutter stable (Dart 3.12+), Android SDK and Java 17. Extract `OfflineVault_Source.tar.xz`, then create a Flutter Android shell:

```bash
flutter create --platforms=android --project-name offlinevault --org com.offlinevault.app offlinevault
```

Copy the extracted `lib/`, `pubspec.yaml`, `analysis_options.yaml` and `android/app/src/main/AndroidManifest.xml` into the generated project. Set Android `minSdk` to 24 in the app Gradle file, then run:

```bash
flutter pub get
flutter analyze
flutter build apk --release
```

## Implemented app features

- Saved-item home list with title, URL, timestamp, archive size and page count.
- Search by title/URL; sort by name or newest date.
- Save one HTML page or crawl same-host linked HTML pages with depth setting 1–3.
- Safety limit of 100 HTML pages per archive.
- Download progress and abortable cancellation.
- Downloads directly referenced images, scripts, stylesheets, icons, preload assets and CSS `url(...)` / `@import` assets (within bounded recursion).
- Rewrites links to successfully archived same-site pages to local relative paths.
- Embedded local-file WebView; blocks external top-level navigation.
- Rename, delete, clear all; SQLite metadata; app-private persistent files.
- Online/offline transport status, Wi-Fi-only gate, storage usage, light/dark theme.

## Important limitations

This is an offline *snapshot* reader, not a complete mirror of every website. Login/session pages, dynamically generated or JavaScript/API-fed content, cross-origin assets and navigation, CAPTCHA, protected downloads, streaming audio/video, service workers and server-dependent features may not work offline. JavaScript files can be saved, but code that needs live APIs cannot be made offline without the necessary data and backend. The network indicator reports Android's network transport; the actual HTTP download can still fail.

## Manual device acceptance test

A successful GitHub build confirms package resolution, static analysis and Android APK compilation. It does **not** prove every site can be archived or replace testing on a real Android device. Install the APK and test:
1. On Wi-Fi, save a static HTTPS page that has an image and stylesheet.
2. Open the saved item and inspect text, image and layout.
3. Enable airplane mode, force-close the app, reopen it and open the same saved item.
4. Save a small same-host site at depth 1 or 2 and test a downloaded internal link.
5. Test 404, no internet, timeout, cancel, Wi-Fi-only, rename, delete and Clear all.
6. Restart the app and verify saved metadata/files remain.
