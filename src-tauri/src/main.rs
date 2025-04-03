// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
  // 加载环境变量
  dotenv::dotenv().ok();
  
  // 运行应用
  app_lib::run();
}
