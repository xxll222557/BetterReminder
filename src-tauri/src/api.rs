use serde::{Deserialize, Serialize};
use std::env;
use log::{info, error};

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
    let current_date = chrono::Local::now().format("%Y-%m-%d").to_string();
    let tomorrow_date = (chrono::Local::now() + chrono::Duration::days(1))
        .format("%Y-%m-%d").to_string();
    
    format!(r#"
Analyze the given task description and break it down into subtasks. Determine the deadline or time limit for each task.

For each task or subtask:

1. Create a clear summary that outlines the basic actions and comes up with some ideas for the task!

2. Estimate the time required to complete the task
3. Assign priorities based on urgency and importance:
- High: Urgent and important; must be completed as soon as possible
- Medium: Important but not urgent
- Low: Neither urgent nor very important
4. If time is mentioned:
- Return a complete ISO formatted time string, including hours and minutes
- Use the current date as a reference
- If a specific time is mentioned (e.g. "3pm"), use that time directly
- If a relative time is mentioned (e.g. "in two hours"), calculate based on the current time
- Always use the 24-hour clock
- If no time limit is mentioned, set the deadline to NULL
- If the time mentioned has already passed today, and it is not mentioned whether the task is due today or tomorrow, output it as tomorrow
5. Please use the input language for output, for example, if the information passed in is simplified Chinese, output it in simplified Chinese

Examples:
- "tomorrow afternoon three" => "{tomorrow_date}T15:00:00+08:00"
- "today evening eight" => "{current_date}T20:00:00+08:00"
- "Two hours later" => [Current time + 2 hours]

Please make sure the returned time contains the correct time zone information (+08:00 means Beijing time)

Time processing rules:
1. Current date: {current_date}
2. Time format specification:
- Must contain full year, month, day, hour, minute, second and time zone information
- Use ISO 8601 format
- Must use the current year to process time
- The time zone is uniformly +08:00 (China Standard Time)

3. Time keyword corresponding rules:
- "Today" => Use the current date
- "Tomorrow" => Current date + 1 day
- "The day after tomorrow" => Current date + 2 days
- "Next week" => Current date + 7 days

4. Example:
Today is {current_date}, then:
- "Tomorrow 12:00" => "{tomorrow_date}T12:00:00+08:00"
- "Today at 3pm" => "{current_date}T15:00:00+08:00"

Please ensure that all returned times:
1. Contain the correct year (current year)
2. Use the full ISO format
3. Contain China time zone information (+08:00)
4. Future times are not mistakenly judged as past times

Format the response as a JSON object, with each task containing the following fields:
{{
  "tasks": [
    {{
      "description": "Individual task summary",
      "creative_idea": "Suggested idea!",
      "estimated_time": "Duration in hours/minutes",
      "priority": "High/Medium/Low",
      "deadline": "YYYY-MM-DD or null if no deadline mentioned"
    }}
  ]
}}

Example input: "Create a presentation for the meeting tomorrow and send invites to all participants, finish before noon"

Example output:
{{
  "tasks": [
    {{
      "description": "Create presentation for the meeting",
      "creative_idea": "Use a slide deck with key points and visuals would be great!",
      "estimated_time": "2 hours",
      "priority": "High",
      "deadline": "{tomorrow_date}T12:00:00+08:00"
    }},
    {{
      "description": "Send meeting invites to participants",
      "creative_idea": "Include agenda and meeting link in the invite",
      "estimated_time": "15 minutes",
      "priority": "Medium",
      "deadline": "{tomorrow_date}T12:00:00+08:00"
    }}
  ]
}}
"#)
}

// 任务分析函数
#[tauri::command]
pub async fn analyze_task(description: String) -> Result<ApiResponse, String> {
    info!("Analyzing task: {}", description);
    
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
    
    #[derive(Serialize, Deserialize)]
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
            }
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
        .await {
            Ok(resp) => resp,
            Err(e) => return Err(format!("Failed to send request to DeepSeek API: {}", e)),
        };
    
    // 处理响应状态
    if !response.status().is_success() {
        let status = response.status();
        let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        error!("API error - Status: {}, Message: {}", status, error_text);
        return Err(format!("DeepSeek API error ({}): {}", status, error_text));
    }
    
    // 解析JSON响应
    #[derive(Deserialize)]
    struct Choice {
        message: Message,
    }
    
    #[derive(Deserialize)]
    struct ApiResponseRaw {
        choices: Vec<Choice>,
    }
    
    let response_json: ApiResponseRaw = match response.json().await {
        Ok(json) => json,
        Err(e) => return Err(format!("Failed to parse DeepSeek API response: {}", e)),
    };
    
    // 确保有选择项
    if response_json.choices.is_empty() {
        return Err("Empty response from DeepSeek API".to_string());
    }
    
    // 解析选择项的内容
    let content = &response_json.choices[0].message.content;
    
    match serde_json::from_str::<ApiResponse>(content) {
        Ok(result) => {
            // 验证数据
            if result.tasks.is_empty() {
                return Err("No tasks found in the analysis result".to_string());
            }
            Ok(result)
        },
        Err(e) => {
            error!("Failed to parse response content as JSON: {}", e);
            error!("Raw content: {}", content);
            Err(format!("Failed to parse response content as JSON: {}", e))
        }
    }
}