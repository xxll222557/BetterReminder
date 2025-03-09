import express, { Request, Response } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { OpenAI } from 'openai';

// Configure dotenv before using process.env
dotenv.config();

// Verify environment variables
if (!process.env.DEEPSEEK_API_KEY) {
  throw new Error('DEEPSEEK_API_KEY is not set in environment variables');
}

const app = express();
app.use(cors());
app.use(express.json());

// Define system prompt for consistent task analysis
const SYSTEM_PROMPT = `
Analyze the given task description and break it down into subtasks. Identify any deadlines or time constraints for each task.

For each task or subtask:
1. Create a clear summary that captures the essential action, suggest some idea for the task!
2. Estimate the time required to complete it
3. Assign a priority level based on urgency and importance:
   - High: Urgent and important; must be done soon
   - Medium: Important but not urgent
   - Low: Neither urgent nor very important
4. 如果提到时间：
   - 请返回完整的 ISO 格式时间字符串，包含小时和分钟
   - 使用当前日期作为基准
   - 如果提到具体时间（如"下午三点"），直接使用该时间
   - 如果是相对时间（如"两小时后"），基于当前时间计算
   - 始终使用 24 小时制

示例：
- "明天下午三点" => "2024-03-10T15:00:00+08:00"
- "今天晚上八点" => "2024-03-09T20:00:00+08:00"
- "两小时后" => [当前时间 + 2小时]

请确保返回的时间包含正确的时区信息（+08:00 表示北京时间）

时间处理规则：
1. 当前日期：${new Date().toISOString().split('T')[0]}
2. 时间格式规范：
   - 必须包含完整年月日时分秒和时区信息
   - 使用 ISO 8601 格式
   - 必须使用当前年份处理时间
   - 时区统一使用 +08:00 (中国标准时间)

3. 时间关键词对应规则：
   - "今天" => 使用当前日期
   - "明天" => 当前日期 + 1 天
   - "后天" => 当前日期 + 2 天
   - "下周" => 当前日期 + 7 天

4. 示例：
   今天是 ${new Date().toISOString().split('T')[0]}，则：
   - "明天中午12点" => "${new Date(Date.now() + 86400000).toISOString().split('T')[0]}T12:00:00+08:00"
   - "今天下午3点" => "${new Date().toISOString().split('T')[0]}T15:00:00+08:00"

请确保所有返回的时间：
1. 包含正确的年份（当前年份）
2. 使用完整的 ISO 格式
3. 包含中国时区信息 (+08:00)
4. 未来时间不会被错误地判断为过去时间

Format the response as JSON:
{
  "tasks": [
    {
      "description": "Individual task summary",
      "creative_idea": "Suggested idea!",
      "estimated_time": "Duration in hours/minutes",
      "priority": "High/Medium/Low",
      "deadline": "YYYY-MM-DD or null if no deadline mentioned"
    }
  ]
}

Example input: "Create a presentation for the meeting tomorrow and send invites to all participants, finish before noon"

Example output:
{
  "tasks": [
    {
      "description": "Create presentation for the meeting",
      "creative_idea": "Use a slide deck with key points and visuals would be great!",
      "estimated_time": "2 hours",
      "priority": "High",
      "deadline": "03-08T12:00:00Z"
    },
    {
      "description": "Send meeting invites to participants",
      "creative_idea": "Include agenda and meeting link in the invite",
      "estimated_time": "15 minutes",
      "priority": "Medium",
      "deadline": "03-08T12:00:00Z"
    }
  ]
}
`;

const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1' //https://api.deepseek.com/v1
});

app.post('/api/analyze-task', async (req: Request, res: Response) => {
  try {
    const { description } = req.body;
    
    if (!description || typeof description !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid request: description is required and must be a string' 
      });
    }

    const response = await client.chat.completions.create({
      model: 'deepseek-r1-distill-llama-70b',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: description }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 2000
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('Empty response from DeepSeek API');
    }

    const result = JSON.parse(content);
    
    // Validate response structure
    if (!Array.isArray(result.tasks)) {
      throw new Error('Invalid response format from DeepSeek API');
    }

    // Validate each task
    result.tasks.forEach((task: any) => {
      if (!task.description || !task.estimated_time || !task.priority) {
        throw new Error('Invalid task format from DeepSeek API');
      }
      if (!['High', 'Medium', 'Low'].includes(task.priority)) {
        throw new Error('Invalid priority value from DeepSeek API');
      }
    });

    res.json(result);
  } catch (error) {
    console.error('API Error:', error);
    
    // More specific error messages
    if (error instanceof SyntaxError) {
      return res.status(500).json({ error: 'Failed to parse DeepSeek API response' });
    }
    
    if (error.message.includes('DeepSeek API')) {
      return res.status(500).json({ error: error.message });
    }

    res.status(500).json({ error: 'Failed to analyze task. Please try again.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});