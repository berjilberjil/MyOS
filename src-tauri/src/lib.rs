#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  #[allow(unused_mut)]
  let mut builder = tauri::Builder::default().plugin(tauri_plugin_notification::init());

  // Full-bleed WKWebView on iOS (kills the safe-area contentInset gap) + haptics.
  #[cfg(any(target_os = "android", target_os = "ios"))]
  {
    builder = builder
      .plugin(tauri_plugin_ios_webview_insets::init())
      .plugin(tauri_plugin_haptics::init());
  }

  builder
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
