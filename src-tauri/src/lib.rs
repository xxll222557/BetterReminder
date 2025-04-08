mod api;
mod db_service;

use api::analyze_task;
use db_service::{
    delete_task, delete_tasks, get_current_user_id, initialize_db, load_tasks, save_tasks,
};
//use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_log::Builder::default().build())
        .setup(|_app| {
            // 初始化数据库
            initialize_db();
            
            //控制台
            //#[cfg(debug_assertions)]
            //{
            //    let window = _app.get_webview_window("main").unwrap();
            //    window.open_devtools();
            //}

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            analyze_task,
            save_tasks,
            load_tasks,
            get_current_user_id,
            delete_task,
            delete_tasks 
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
