use log::{error, info};
use serde::{Deserialize, Serialize};
use std::env;

// API响应的任务类型定义
#[derive(Debug, Serialize, Deserialize)]
pub struct Task {
    pub description: String,
    pub creative_idea: String,
    #[serde(rename = "estimated_time")]
    pub estimated_time: String,
    pub priority: String,
    pub deadline: Option<String>,
}

// API响应的整体结构
#[derive(Debug, Serialize, Deserialize)]
pub struct ApiResponse {
    pub tasks: Vec<Task>,
}

// 生成系统提示
fn generate_system_prompt() -> String {
    let now = chrono::Local::now();
    let current_date = now.format("%Y-%m-%d").to_string();
    let current_time = now.format("%H:%M:%S").to_string();
    let current_datetime = now.format("%Y-%m-%dT%H:%M:%S%z").to_string();
    
    // 提取时区偏移（从ISO格式的日期时间中）
    let timezone_offset = now.format("%:z").to_string();
    
    let tomorrow = now + chrono::Duration::days(1);
    let tomorrow_date = tomorrow.format("%Y-%m-%d").to_string();
    let tomorrow_datetime = tomorrow.format("%Y-%m-%dT%H:%M:%S%z").to_string();

    format!(
        r#"
分析给定的任务描述并将其分解为子任务。确定每个任务的截止日期或时间限制。

当前系统时间信息：
- 当前日期时间（ISO格式）：{current_datetime}
- 当前日期：{current_date}
- 当前时间：{current_time}
- 系统时区偏移：{timezone_offset}

对于每个任务或子任务：

1. 创建一个清晰的摘要，概述基本操作并提出一些任务想法！

2. 估计完成任务所需的时间
3. 根据紧急程度和重要性分配优先级：
- 高：紧急且重要；必须尽快完成
- 中等：重要但不紧急
- 低：不紧急也不非常重要
4. 如果提到时间：
- 返回完整的 ISO 格式的时间字符串，包括小时和分钟
- 使用当前日期时间 {current_datetime} 作为参考
- 如果提到具体时间（例如"下午 3 点"），则直接使用该时间并附加当前系统时区 {timezone_offset}
- 如果提到相对时间（例如"两小时后"），则根据当前时间计算
- 始终使用 24 小时制
- 如果没有提到时间限制，则将截止日期设置为 NULL
- 如果提到的时间今天已经过去，并且没有提到任务是今天还是明天截止，则将其输出为明天

你必须以规范的 JSON 格式返回响应，结构如下：
{{
  "tasks": [
    {{
      "description": "任务描述",
      "creative_idea": "创新的完成方式",
      "estimated_time": "估计完成时间",
      "priority": "优先级（High/Medium/Low）",
      "deadline": "截止日期时间（ISO格式，包含时区信息）或 null"
    }},
    // 可能有更多任务...
  ]
}}

始终使用此 JSON 结构，确保格式正确，并包含所有必需字段。如果某些信息不可用，可以使用合理的默认值。
"#
    )
}

// 任务分析函数
#[tauri::command]
pub async fn analyze_task(description: String) -> Result<ApiResponse, String> {
    let start_time = chrono::Local::now();
    info!("Analyzing task at: {}", start_time.format("%Y-%m-%dT%H:%M:%S%.3f%z"));
    info!("Task description: {}", description);

    if description.trim().is_empty() {
        return Err("Task description cannot be empty".to_string());
    }

    // 读取API密钥
    let api_key = match env::var("DEEPSEEK_API_KEY") {
        Ok(key) => key,
        Err(_) => return Err("DEEPSEEK_API_KEY environment variable not set".to_string()),
    };

    // 构建请求
    let client = reqwest::Client::new();
    let system_prompt = generate_system_prompt();

    #[derive(Serialize, Deserialize, Debug)]  // 添加 Debug
    struct Message {
        role: String,
        content: String,
    }

    #[derive(Serialize)]
    struct ResponseFormat {
        #[serde(rename = "type")]
        format_type: String,
    }

    #[derive(Serialize)]
    struct RequestBody {
        model: String,
        messages: Vec<Message>,
        response_format: ResponseFormat,
        temperature: f32,
        max_tokens: u32,
    }

    let request_body = RequestBody {
        model: "deepseek-chat".to_string(),
        messages: vec![
            Message {
                role: "system".to_string(),
                content: system_prompt,
            },
            Message {
                role: "user".to_string(),
                content: description,
            },
        ],
        response_format: ResponseFormat {
            format_type: "json_object".to_string(),
        },
        temperature: 0.7,
        max_tokens: 2000,
    };

    // 发送请求
    let response = match client
        .post("https://api.deepseek.com/v1/chat/completions")
        .header("Content-Type", "application/json")
        .header("Authorization", format!("Bearer {}", api_key))
        .json(&request_body)
        .send()
        .await
    {
        Ok(resp) => resp,
        Err(e) => return Err(format!("Failed to send request to DeepSeek API: {}", e)),
    };

    // 处理响应状态
    if !response.status().is_success() {
        let status = response.status();
        let error_text = response
            .text()
            .await
            .unwrap_or_else(|_| "Unknown error".to_string());
        error!("API error - Status: {}, Message: {}", status, error_text);
        return Err(format!("DeepSeek API error ({}): {}", status, error_text));
    }

    // 解析JSON响应
    #[derive(Deserialize, Debug)]  // 添加 Debug
    struct Choice {
        message: Message,
    }

    #[derive(Deserialize, Debug)]  // 添加 Debug
    struct ApiResponseRaw {
        choices: Vec<Choice>,
    }

    let response_json: ApiResponseRaw = match response.json().await {
        Ok(json) => {
            // 现在可以正常打印调试信息
            info!("Raw API Response: {:?}", json);
            json
        },
        Err(e) => return Err(format!("Failed to parse DeepSeek API response: {}", e)),
    };

    // 确保有选择项
    if response_json.choices.is_empty() {
        return Err("Empty response from DeepSeek API".to_string());
    }

    // 解析选择项的内容
    let content = &response_json.choices[0].message.content;

    // 处理完成后再记录一次时间
    let end_time = chrono::Local::now();
    info!("Analysis completed at: {}", end_time.format("%Y-%m-%dT%H:%M:%S%.3f%z"));
    info!("Processing time: {} ms", (end_time - start_time).num_milliseconds());

    // 在解析 JSON 响应时添加这段代码
    match serde_json::from_str::<ApiResponse>(content) {
        Ok(result) => {
            // 验证数据
            if result.tasks.is_empty() {
                error!("Empty tasks array in API response");
                error!("Raw content: {}", content);
                return Err("No tasks found in the analysis result".to_string());
            }
            
            // 打印解析后的结构化数据
            info!("Parsed API Response: {:?}", result);
            info!("Tasks count: {}", result.tasks.len());
            
            // 打印每个任务的详细信息
            for (i, task) in result.tasks.iter().enumerate() {
                info!("Task #{}: description=\"{}\", deadline={:?}, priority={}",
                    i + 1,
                    task.description,
                    task.deadline,
                    task.priority
                );
            }
            
            Ok(result)
        }
        Err(e) => {
            error!("Failed to parse response content as JSON: {}", e);
            error!("Raw content: {}", content);
            Err(format!("Failed to parse response content as JSON: {}", e))
        }
    }
}
