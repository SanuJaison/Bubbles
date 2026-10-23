use tauri::{
    utils::config::WebviewUrl,
    webview::{NewWindowResponse, WebviewWindowBuilder},
};

#[cfg(debug_assertions)]
const APP_URL: &str = "http://localhost:5173";

#[cfg(not(debug_assertions))]
const APP_URL: &str = "https://bubbles-zeta-nine.vercel.app";

fn is_app_host(host: &str) -> bool {
    if host == "bubbles-zeta-nine.vercel.app" {
        return true;
    }

    #[cfg(debug_assertions)]
    if host == "localhost" || host == "127.0.0.1" {
        return true;
    }

    false
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            WebviewWindowBuilder::new(
                app,
                "main",
                WebviewUrl::External(APP_URL.parse().expect("valid Bubbles URL")),
            )
            .title("Bubbles")
            .inner_size(1280.0, 820.0)
            .min_inner_size(960.0, 640.0)
            .resizable(true)
            .center()
            .on_navigation(|url| {
                if url.scheme() == "about" || is_app_host(url.host_str().unwrap_or_default()) {
                    true
                } else {
                    let _ = open::that(url.as_str());
                    false
                }
            })
            .on_new_window(|url, _features| {
                if url.scheme() == "about"
                    || url.host_str() == Some("accounts.google.com")
                    || is_app_host(url.host_str().unwrap_or_default())
                {
                    // Google sign-in needs a real popup so its opener survives.
                    NewWindowResponse::Allow
                } else {
                    let _ = open::that(url.as_str());
                    NewWindowResponse::Deny
                }
            })
            .build()?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
