# Bubbles Desktop

Windows desktop wrapper for the Bubbles web app, built with Tauri 2 and WebView2. The app opens the hosted Bubbles frontend in a native window so Google sign-in, calls, and the rest of the web app behave exactly as they do in a browser.

## Prerequisites

- Node.js 20+
- Rust stable with the MSVC toolchain
- Visual Studio Build Tools 2022 with the "Desktop development with C++" workload
- WebView2 Runtime (preinstalled on current Windows 10/11 systems)

## Development

```powershell
cd frontend/desktop
npm install
npm run dev
```

The dev command starts the Vite frontend on port 5173 and opens it in a Tauri window.

## Production build

```powershell
cd frontend/desktop
npm install
npm run build
```

Tauri produces the Windows bundles under:

```text
frontend/desktop/src-tauri/target/release/bundle/
```

Installers are generated as NSIS `.exe` and WiX `.msi` packages.

## Release builds

The GitHub Actions workflow at `.github/workflows/desktop.yml` builds the Windows installers on `windows-latest` and publishes them to a GitHub Release. Push a tag matching `desktop-v*` to start it:

```powershell
git tag desktop-v1.0.2
git push origin desktop-v1.0.2
```

## Notes

- The production app loads `https://bubbles-zeta-nine.vercel.app`; the dev app loads `http://localhost:5173`.
- Google sign-in opens a popup. The app allows `accounts.google.com` popups so the OAuth opener relationship survives.
- The OAuth client's **Authorized JavaScript origins** must include `https://bubbles-zeta-nine.vercel.app`. Google rejects `http://tauri.localhost` because it is not a public top-level domain, which is why the desktop app loads the hosted Vercel origin instead.
- WebView2 tracking prevention is disabled for the app profile. Without this, Google Identity Services storage is blocked and the sign-in button renders as a zero-sized iframe.
- Camera and microphone access for calls depends on Windows privacy settings and WebView2 media permissions. WebView2 prompts the user on first use.
- External links open in the default browser instead of navigating the app window away from Bubbles.
- The Windows installers are unsigned. Windows SmartScreen may show a warning; users can choose **More info** then **Run anyway**.
- The landing page falls back to `https://github.com/SanuJaison/Bubbles/releases/latest` when `VITE_WINDOWS_DOWNLOAD_URL` is not set.
