# Mobile Store Release Guide — Thullaabul Ilmi

Panduan lengkap rilis aplikasi **Thullaabul Ilmi** ke Google Play Store (Android) dan Apple App Store (iOS).

---

## Status Saat Ini (2026-10-03)

| Platform | Status | Artifact |
|----------|--------|----------|
| **Android (Google Play)** | ✅ Build Ready | `apps/mobile/android/app/build/outputs/bundle/release/app-release.aab` (61.8 MB) |
| **iOS (App Store)** | ⏳ Config Ready | `app.json` updated, but iOS project not yet generated |

---

## 1. Google Play Store (Android)

### 1.1 Artifacts Ready
- **AAB Release**: `apps/mobile/android/app/build/outputs/bundle/release/app-release.aab`
- **Signing**: Production keystore configured via `apps/mobile/android/app/thollabul-ilmi-release.keystore` + env vars
- **App ID**: `com.thullaabulilmi.app`
- **Version**: `versionCode: 1`, `versionName: "1.0.0"`

### 1.2 Store Listing Assets (`apps/mobile/store-assets/`)
| Asset | File | Spec |
|-------|------|------|
| App Icon (512×512) | `play-store-icon-512.png` | 32-bit PNG, no alpha |
| Feature Graphic (1024×500) | `play-store-feature-graphic-1024x500.png` | 24-bit PNG/JPG |
| Screenshots | *TBD* | 4–8 phone screenshots (1080×1920 or 1440×2560) |

### 1.3 Required Before Upload

#### A. Generate Play Console Release Keystore (One-time)
```bash
keytool -genkeypair \
  -v -keystore upload-keystore.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias upload \
  -storepass <STORE_PASSWORD> \
  -keypass <KEY_PASSWORD> \
  -dname "CN=Thullaabul Ilmi, OU=Mobile, O=Thullabul Ilmi, L=Jakarta, ST=DKI Jakarta, C=ID"
```
- Save `upload-keystore.jks` securely (not in repo).
- Register upload certificate with Play Console → App Signing.

#### B. Capture Screenshots (Phone + 7" Tablet optional)
```bash
# Start emulator first (already done in prior session)
emulator -avd tholabul_pixel_7_api36 -no-window -gpu swiftshader_indirect -no-snapshot -no-boot-anim &

# Run screenshot script (requires installed release APK)
cd apps/mobile
./scripts/screenshot-features.sh --out-dir store-assets/screenshots --skip-install
```
Screenshots saved to `apps/mobile/store-assets/screenshots/` — copy required ones to Play Console listing.

#### C. Data Safety & Privacy Policy
- `apps/mobile/store-assets/data_safety_answers.md` → fill Data Safety section in Play Console.
- `apps/mobile/store-assets/privacy_policy.md` → host publicly (e.g., GitHub Pages) and link in Play Console.

#### D. Closed Testing (14-day requirement for new personal accounts)
1. Create **Closed Track** in Play Console.
2. Upload AAB → submit for review.
3. Add testers (emails) → wait 14 days.
4. Promote to **Production** after compliance.

---

## 2. Apple App Store (iOS)

### 2.1 Configuration Ready
- `app.json` → `ios.bundleIdentifier: "com.thullaabulilmi.app"`
- `app.json` → `ios.buildNumber: "1"`
- `app.json` → `owner: "agambondan"` (EAS project ID)

### 2.2 Required Before Build

#### A. Generate iOS Project (Expo Prebuild)
```bash
cd apps/mobile
npx expo prebuild --platform ios --clean
```
This creates `ios/` folder with Xcode project.

#### B. Configure Signing & Certificates (via EAS or Manual)
**Option 1: EAS Build (Recommended — no Mac required)**
```bash
# Install EAS CLI
npm install -g eas-cli
eas login

# Configure credentials (run once)
eas credentials
# → Select "iOS" → "Distribution" → "Let EAS manage"

# Build for App Store
eas build --platform ios --profile production
```

**Option 2: Local Xcode Build (macOS + Xcode required)**
```bash
# Open Xcode workspace
open apps/mobile/ios/ThullaabulIlmi.xcworkspace
# → Set Team, Bundle ID, Provisioning Profile
# → Product → Archive → Distribute App
```

#### C. App Store Connect Setup
1. Create App in App Store Connect → Bundle ID `com.thullaabulilmi.app`.
2. Fill metadata (name, description, keywords, screenshots).
3. Upload privacy policy URL.
4. Submit for Review → wait for Apple approval.

---

## 3. Version Bumping Procedure

### Android (`app.json` + `android/app/build.gradle`)
```json
// app.json
"version": "1.0.1",
"android": { "versionCode": 2 }
```
```gradle
// android/app/build.gradle (syncs from app.json via expo prebuild or manual)
defaultConfig {
    versionCode 2
    versionName "1.0.1"
}
```

### iOS (`app.json`)
```json
"version": "1.0.1",
"ios": { "buildNumber": "2" }
```

---

## 4. Release Checklist (Copy to Checklist App)

### Google Play Store
- [ ] Upload `app-release.aab` to Play Console (Internal/Closed/Production track)
- [ ] Fill Store Listing (title, short/long desc, icon, feature graphic, screenshots)
- [ ] Complete Data Safety questionnaire
- [ ] Link Privacy Policy URL
- [ ] Set Target Audience & Content Rating
- [ ] Configure Pricing & Distribution (Free, Indonesia + Global)
- [ ] Submit for Review
- [ ] If new account: run Closed Test 14 days → Promote to Production

### Apple App Store
- [ ] Run `npx expo prebuild --platform ios` (first time)
- [ ] Configure EAS credentials or Xcode signing
- [ ] Build production `.ipa` via `eas build --platform ios --profile production`
- [ ] Upload to App Store Connect via Transporter or Xcode
- [ ] Fill App Store Connect metadata (screenshots, desc, keywords, privacy URL)
- [ ] Submit for Review
- [ ] Monitor review status → Release when approved

---

## 5. Automated Build Scripts (Future CI/CD)

### GitHub Actions / GitLab CI Example
```yaml
# .github/workflows/android-release.yml
jobs:
  build-aab:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { distribution: 'temurin', java-version: '17' }
      - run: cd apps/mobile/android && ./gradlew bundleRelease
      - uses: actions/upload-artifact@v4
        with: { name: app-release-aab, path: apps/mobile/android/app/build/outputs/bundle/release/*.aab }
```

---

## 6. Troubleshooting

| Issue | Solution |
|-------|----------|
| `Execution failed for task ':app:signReleaseBundle'` | Keystore path/password env vars not set; verify `THOLLABUL_RELEASE_STORE_*` in CI or `~/.gradle/gradle.properties` |
| `Version code already used` | Increment `versionCode` in `app.json` + re-run prebuild |
| `Bundle identifier already taken` | Use different bundle ID (e.g., `com.thullaabulilmi.app.prod`) or claim existing in Apple Developer |
| `App signing key mismatch` | Register upload certificate in Play Console → App Integrity |

---

## 7. File References

| File | Purpose |
|------|---------|
| `apps/mobile/app.json` | Expo config (version, IDs, permissions) |
| `apps/mobile/android/app/build.gradle` | Gradle signing config (debug + release) |
| `apps/mobile/android/app/thollabul-ilmi-release.keystore` | Local release keystore (CI uses env vars) |
| `apps/mobile/store-assets/` | Play Store listing assets |
| `apps/mobile/scripts/screenshot-features.sh` | Automated deep-link screenshots |

---

> **Catatan:** Panduan ini valid untuk Expo SDK 54 / React Native 0.81. Perbarui saat upgrade major.