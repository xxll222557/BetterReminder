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
    let current_date = chrono::Local::now().format("%Y-%m-%d").to_string();
    let tomorrow_date = (chrono::Local::now() + chrono::Duration::days(1))
        .format("%Y-%m-%d")
        .to_string();

    format!(
        r#"
分析给定的任务描述并将其分解为子任务。确定每个任务的截止日期或时间限制。

对于每个任务或子任务：

1. 创建一个清晰的摘要，概述基本操作并提出一些任务想法！

2. 估计完成任务所需的时间
3. 根据紧急程度和重要性分配优先级：
- 高：紧急且重要；必须尽快完成
- 中等：重要但不紧急
- 低：不紧急也不非常重要
4. 如果提到时间：
- 返回完整的 ISO 格式的时间字符串，包括小时和分钟
- 使用当前日期作为参考
- 如果提到具体时间（例如“下午 3 点”），则直接使用该时间
- 如果提到相对时间（例如“两小时后”），则根据当前时间计算
- 始终使用 24 小时制
- 如果没有提到时间限制，则将截止日期设置为 NULL
- 如果提到的时间今天已经过去，并且没有提到任务是今天还是明天截止，则将其输出为明天
5. 请使用输入语言进行输出，例如，如果传入的信息是简体中文，则以简体中文输出

示例：
- “明天下午三点” => “{tomorrow_date}T15:00:00+08:00”
- “今天晚上八点” => "{current_date}T20:00:00+08:00"
- "两小时后" => [当前时间 + 2 小时]

请确保返回的时间包含正确的时区信息（+08:00 表示北京时间）

时间处理规则：
1.当前日期：{current_date}
2.时间格式规范：
- 必须包含完整的年、月、日、时、分、秒和时区信息
- 使用 ISO 8601 格式
- 必须使用当前年份处理时间
- 时区统一为 +08:00（中国标准时间）

3.时间关键字对应规则：
- "今天" => 使用当前日期
- "明天" => 当前日期 + 1 天
- "后天" => 当前日期 + 2 天
- "下周" => 当前日期 + 7 天

4.示例：
今天是 {current_date}，则：
- "明天 12:00" => "{tomorrow_date}T12:00:00+08:00"
- "今天下午 3 点" => "{current_date}T15:00:00+08:00"

请确保所有返回的时间：
1. 包含正确的年份（当前年份）
2. 使用完整的 ISO 格式
3. 包含中国时区信息（+08:00）
4. 未来时间不会被误判为过去时间

将响应格式化为 JSON 对象，每个任务包含以下字段：
{{
  "tasks": [
    {{
      "description": "单个任务摘要",
      "creative_idea": "建议的想法！",
      "estimated_time": "持续时间（小时/分钟）",
      "priority": "高/中/低",
      "deadline": "YYYY-MM-DD 或 null（如果没有提到截止日期）"
    }}
  ]
}}

示例输入： “为明天的会议创建演示文稿并向所有参与者发送邀请，中午之前完成”

Example output:
{{
  "tasks": [
    {{
      "description": "为会议创建演示文稿",
      "creative_idea": "使用包含要点和视觉效果的幻灯片会很棒！",
      "estimated_time": "2小时",
      "priority": "高",
      "deadline": "{tomorrow_date}T12:00:00+08:00"
    }},
    {{
      "description": "向参与者发送会议邀请",
      "creative_idea": "在邀请中包含议程和会议链接",
      "estimated_time": "15分钟",
      "priority": "中",
      "deadline": "{tomorrow_date}T12:00:00+08:00"
    }}
  ]
}}
"#
    )
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
        }
        Err(e) => {
            error!("Failed to parse response content as JSON: {}", e);
            error!("Raw content: {}", content);
            Err(format!("Failed to parse response content as JSON: {}", e))
        }
    }
}
