use log::{error, info};
use once_cell::sync::Lazy;
use rusqlite::{params, Connection, Result as SqlResult};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use uuid::Uuid;

// 与前端 Task 类型相对应的结构体
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Task {
    pub id: String,
    pub description: String,
    pub creative_idea: String,
    #[serde(rename = "estimatedTime")]
    pub estimated_time: String,
    pub priority: String,
    pub deadline: Option<String>,
    pub completed: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub timestamp: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub user_id: Option<String>,
}

// 数据库连接管理
static DB_CONNECTION: Lazy<Mutex<Option<Connection>>> = Lazy::new(|| Mutex::new(None));
static USER_ID: Lazy<Mutex<Option<String>>> = Lazy::new(|| Mutex::new(None));

// 获取数据库文件路径
fn get_db_path() -> PathBuf {
    let mut path = dirs::data_dir().expect("无法获取数据目录");
    path.push("task-analyzer");
    fs::create_dir_all(&path).expect("无法创建应用数据目录");
    path.push("tasks.db");
    path
}

// 初始化数据库
fn init_db() -> SqlResult<Connection> {
    let db_path = get_db_path();
    info!("数据库路径: {:?}", db_path);

    let conn = Connection::open(db_path)?;

    // 创建任务表
    conn.execute(
        "CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            description TEXT NOT NULL,
            creative_idea TEXT NOT NULL,
            estimated_time TEXT NOT NULL,
            priority TEXT NOT NULL,
            deadline TEXT,
            completed INTEGER NOT NULL DEFAULT 0,
            timestamp INTEGER NOT NULL,
            user_id TEXT NOT NULL
        )",
        [],
    )?;

    // 创建索引
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_user_id ON tasks (user_id)",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_timestamp ON tasks (timestamp)",
        [],
    )?;

    Ok(conn)
}

// 获取或创建数据库连接
fn get_db_connection() -> SqlResult<Connection> {
    let mut conn_guard = DB_CONNECTION.lock().unwrap();

    if conn_guard.is_none() {
        *conn_guard = Some(init_db()?);
    }

    // 这里我们克隆连接来返回
    // 注意：SQLite连接实际不支持真正的克隆，但在这个上下文中，我们可以安全地创建一个新连接
    let conn = init_db()?;
    Ok(conn)
}

// 获取用户ID (类似于原来的cookie功能)
fn get_user_id() -> String {
    let mut user_id_guard = USER_ID.lock().unwrap();

    if user_id_guard.is_none() {
        // 生成新的UUID
        let new_id = Uuid::new_v4().to_string();
        *user_id_guard = Some(new_id);
    }

    user_id_guard.clone().unwrap()
}

// Tauri命令：保存任务
#[tauri::command]
pub async fn save_tasks(tasks: Vec<Task>) -> Result<(), String> {
    let user_id = get_user_id();
    let timestamp = chrono::Utc::now().timestamp_millis();

    // 获取数据库连接
    let mut conn = match get_db_connection() {
        Ok(conn) => conn,
        Err(e) => {
            error!("数据库连接失败: {}", e);
            return Err(format!("数据库连接失败: {}", e));
        }
    };

    // 开始事务
    let tx = match conn.transaction() {
        Ok(tx) => tx,
        Err(e) => {
            error!("创建事务失败: {}", e);
            return Err(format!("创建事务失败: {}", e));
        }
    };

    // 删除该用户的所有现有任务
    match tx.execute("DELETE FROM tasks WHERE user_id = ?1", params![user_id]) {
        Ok(_) => (),
        Err(e) => {
            error!("删除现有任务失败: {}", e);
            return Err(format!("删除现有任务失败: {}", e));
        }
    }

    // 保存任务数量和新任务
    let tasks_len = tasks.len();
    for task in tasks {
        let task_id = task.id.clone();
        let completed = if task.completed { 1 } else { 0 };

        match tx.execute(
            "INSERT INTO tasks (id, description, creative_idea, estimated_time, priority, deadline, completed, timestamp, user_id) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![
                task_id,
                task.description,
                task.creative_idea,
                task.estimated_time,
                task.priority,
                task.deadline,
                completed,
                timestamp,
                user_id
            ],
        ) {
            Ok(_) => (),
            Err(e) => {
                error!("插入任务失败: {} {:?}", e, task);
                return Err(format!("插入任务失败: {}", e));
            }
        }
    }

    match tx.commit() {
        Ok(_) => {
            info!("成功保存 {} 个任务", tasks_len);
            Ok(())
        }
        Err(e) => {
            error!("提交事务失败: {}", e);
            Err(format!("提交事务失败: {}", e))
        }
    }
}

// Tauri命令：加载任务
#[tauri::command]
pub async fn load_tasks() -> Result<Vec<Task>, String> {
    let user_id = get_user_id();

    // 获取数据库连接
    let conn = match get_db_connection() {
        Ok(conn) => conn,
        Err(e) => {
            error!("数据库连接失败: {}", e);
            return Err(format!("数据库连接失败: {}", e));
        }
    };

    // 查询任务
    let mut stmt = match conn.prepare(
        "SELECT id, description, creative_idea, estimated_time, priority, deadline, completed, timestamp, user_id 
         FROM tasks 
         WHERE user_id = ?1 
         ORDER BY timestamp DESC"
    ) {
        Ok(stmt) => stmt,
        Err(e) => {
            error!("准备查询语句失败: {}", e);
            return Err(format!("准备查询语句失败: {}", e));
        }
    };

    // 执行查询并映射结果
    let task_result = stmt.query_map(params![user_id], |row| {
        let completed: i32 = row.get(6)?;

        Ok(Task {
            id: row.get(0)?,
            description: row.get(1)?,
            creative_idea: row.get(2)?,
            estimated_time: row.get(3)?,
            priority: row.get(4)?,
            deadline: row.get(5)?,
            completed: completed == 1,
            timestamp: Some(row.get(7)?),
            user_id: Some(row.get(8)?),
        })
    });

    match task_result {
        Ok(tasks_iter) => {
            let mut tasks = Vec::new();
            for task in tasks_iter {
                match task {
                    Ok(t) => tasks.push(t),
                    Err(e) => {
                        error!("解析任务记录失败: {}", e);
                        return Err(format!("解析任务记录失败: {}", e));
                    }
                }
            }

            info!("成功加载 {} 个任务", tasks.len());
            Ok(tasks)
        }
        Err(e) => {
            error!("查询任务失败: {}", e);
            Err(format!("查询任务失败: {}", e))
        }
    }
}

// Tauri命令：获取用户ID
#[tauri::command]
pub fn get_current_user_id() -> String {
    get_user_id()
}

// Tauri命令：删除任务
#[tauri::command]
pub async fn delete_task(task_id: String) -> Result<(), String> {
    let user_id = get_user_id();

    // 获取数据库连接
    let conn = match get_db_connection() {
        Ok(conn) => conn,
        Err(e) => {
            error!("数据库连接失败: {}", e);
            return Err(format!("数据库连接失败: {}", e));
        }
    };

    // 删除指定任务
    match conn.execute(
        "DELETE FROM tasks WHERE id = ?1 AND user_id = ?2",
        params![task_id, user_id],
    ) {
        Ok(rows) => {
            if rows == 0 {
                info!("未找到要删除的任务: {}", task_id);
                return Err(format!("未找到任务: {}", task_id));
            }
            info!("已删除任务: {}", task_id);
            Ok(())
        }
        Err(e) => {
            error!("删除任务失败: {}", e);
            Err(format!("删除任务失败: {}", e))
        }
    }
}

// Tauri命令：批量删除任务
#[tauri::command]
pub async fn delete_tasks(task_ids: Vec<String>) -> Result<(), String> {
    let user_id = get_user_id();

    // 获取数据库连接
    let mut conn = match get_db_connection() {
        Ok(conn) => conn,
        Err(e) => {
            error!("数据库连接失败: {}", e);
            return Err(format!("数据库连接失败: {}", e));
        }
    };

    // 开始事务
    let tx = match conn.transaction() {
        Ok(tx) => tx,
        Err(e) => {
            error!("创建事务失败: {}", e);
            return Err(format!("创建事务失败: {}", e));
        }
    };

    // 删除多个任务
    let mut deleted_count = 0;
    for task_id in &task_ids {
        match tx.execute(
            "DELETE FROM tasks WHERE id = ?1 AND user_id = ?2",
            params![task_id, user_id],
        ) {
            Ok(rows) => {
                deleted_count += rows;
            }
            Err(e) => {
                error!("删除任务失败: {} (ID: {})", e, task_id);
                return Err(format!("删除任务失败: {}", e));
            }
        }
    }

    // 提交事务
    match tx.commit() {
        Ok(_) => {
            info!(
                "成功删除 {} 个任务 (共尝试 {})",
                deleted_count,
                task_ids.len()
            );
            Ok(())
        }
        Err(e) => {
            error!("提交事务失败: {}", e);
            Err(format!("提交事务失败: {}", e))
        }
    }
}

// 在应用启动时初始化数据库
pub fn initialize_db() {
    match get_db_connection() {
        Ok(_) => info!("数据库初始化成功"),
        Err(e) => error!("数据库初始化失败: {}", e),
    }

    // 初始化用户ID
    get_user_id();
}
