# Bubbles Desktop

Windows desktop wrapper for the Bubbles web app, built with Tauri 2 and WebView2.

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

The frontend is built first, then Tauri produces the Windows bundles under:

```text
frontend/desktop/src-tauri/target/release/bundle/
```

Installers are generated as NSIS `.exe` and WiX `.msi` packages.

## Notes

- The desktop app uses the same production frontend and backend URLs as the web app.
- Camera and microphone access for calls depends on Windows privacy settings and WebView2 media permissions.
- Publish the generated installers through GitHub Releases and set `VITE_WINDOWS_DOWNLOAD_URL` in the frontend deployment when a release is available.
