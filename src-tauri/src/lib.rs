mod api;

use api::analyze_task;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_log::Builder::default().build())
    .invoke_handler(tauri::generate_handler![analyze_task])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
