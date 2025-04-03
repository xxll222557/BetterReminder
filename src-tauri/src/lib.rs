mod api;
mod db_service;  // 新增模块引用

use api::analyze_task;
use db_service::{save_tasks, load_tasks, get_current_user_id, initialize_db, delete_task, delete_tasks};
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_log::Builder::default().build())
    .setup(|app| {
      // 初始化数据库
      initialize_db();
      //控制台
      #[cfg(debug_assertions)]
      {
        let window = app.get_webview_window("main").unwrap();
        window.open_devtools();
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      analyze_task,
      save_tasks,
      load_tasks,
      get_current_user_id,
      delete_task,   // 添加这一行
      delete_tasks   // 添加这一行
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
