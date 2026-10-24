# Ani Bran Android APK

This Android WebView wrapper packages the existing `brain-game/` static app into the APK without editing its HTML, CSS, JavaScript, games, or levels.

- Launcher name: Ani Bran
- Package: `com.anibran.game`
- Game assets are copied from `brain-game/` into the APK during CI.
- JavaScript and local storage are enabled so existing gameplay and on-device progress work.
- The APK build is produced by `.github/workflows/build-anibran-apk.yml`.
- CI uploads a directly installable debug-signed APK as the `ani-bran-android-apk` artifact.

Debug-signed APKs can be installed for testing, but use a release signing key before public Play Store distribution.
