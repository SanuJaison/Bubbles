use tauri::{
    utils::config::WebviewUrl,
    webview::{NewWindowResponse, WebviewWindowBuilder},
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            WebviewWindowBuilder::new(app, "main", WebviewUrl::App("index.html".into()))
                .title("Bubbles")
                .inner_size(1280.0, 820.0)
                .min_inner_size(960.0, 640.0)
                .resizable(true)
                .center()
                // Google sign-in opens its consent screen with window.open.
                // Let the webview handle that popup so the OAuth opener
                // relationship survives and the credential can be returned.
                .on_new_window(|_url, _features| NewWindowResponse::Allow)
                .build()?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
