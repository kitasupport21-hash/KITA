# OfflineVault

Android Flutter app for downloading HTML web pages and reading saved copies offline.

## Repository layout

- Source branch: `offlinevault`
- Source bundle: `OfflineVault_Source.tar.xz`
- APK workflow: `.github/workflows/build-apk.yml`

## Build and download APK

Every push to `offlinevault` starts **OfflineVault Android APK** in GitHub Actions. It also supports manual starts:

1. Open the repository's **Actions** tab.
2. Select **OfflineVault Android APK**.
3. Open the latest run.
4. Wait for the **Analyze and build release APK** job to finish successfully.
5. Download `OfflineVault-Android-APK` under Artifacts, or use the latest GitHub Release if published.

The workflow creates a generated Flutter Android shell, installs these sources, resolves packages, runs static analysis, builds a release APK, uploads the APK artifact and publishes a release.

## Implemented features

- Saved-items home list with title, URL, saved date, size and page count.
- Search by title or URL; sort by name or newest date.
- Save a single HTML page or crawl same-host linked pages with a depth setting of 1–3.
- Bounded crawl of up to 100 HTML pages per archive.
- Download progress and cancellable HTTP requests.
- Download referenced images, scripts, stylesheets, icons, poster/preload assets and CSS `url(...)` / quoted `@import` resources to a limited recursion depth.
- Rewrite saved same-host page links and archived asset references to local paths.
- Offline WebView reader that blocks top-level navigation to pages outside the saved archive.
- Rename, delete, clear all, SQLite metadata, and persistent files in the app-private documents directory.
- Online/offline transport status, Wi-Fi-only download option, depth setting, storage usage, dark/light theme.
- Android Internet and network-state permissions; external storage permission is not needed.

## Setup locally

Install Flutter stable (Dart 3.12+), Android SDK and Java. Extract the source bundle, create a Flutter Android project shell, copy the source files and set Android `minSdk` to 24.

```bash
flutter create --platforms=android --project-name offlinevault --org com.offlinevault.app offlinevault
```

Copy `lib/`, `pubspec.yaml`, `analysis_options.yaml` and `android/app/src/main/AndroidManifest.xml` from the source bundle into the generated project. Then run:

```bash
flutter pub get
flutter analyze
flutter build apk --release
```

## Limitations and device acceptance

This app creates an offline snapshot; it cannot turn a live site into a perfect mirror. Login-protected pages, server/API-dependent dynamic data, CAPTCHA, streaming media, service workers, cross-origin resources and content generated after JavaScript runs may be missing or incomplete. Transport status alone does not guarantee the public internet is reachable.

After installing the APK, test on a real Android phone:
1. Save a static HTTPS page with a picture and stylesheet while online.
2. Open it and check the text, picture and layout.
3. Enable airplane mode, force-close the app, reopen it and open the saved page again.
4. Save a small same-host site at depth 1 or 2 and test an archived internal link.
5. Test 404, no internet, timeout, cancellation and Wi-Fi-only.
6. Test restart persistence, rename, delete, Clear all, sorting, storage usage and theme switching.

A successful CI build verifies package resolution, static analysis and Android APK compilation. It does not replace offline testing on an actual phone or guarantee compatibility with every website.
