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

function formatLocalToISO(timeframe = "now", value = 1) {
  const now = new Date();

  switch (timeframe.toLowerCase()) {
      case "tomorrow":
          now.setDate(now.getDate() + 1);
          break;
      case "nextweek":
          now.setDate(now.getDate() + 7);
          break;
      case "nextmonth":
          now.setMonth(now.getMonth() + 1);
          break;
      case "days":
          now.setDate(now.getDate() + value);
          break;
      case "weeks":
          now.setDate(now.getDate() + value * 7);
          break;
      case "months":
          now.setMonth(now.getMonth() + value);
          break;
      case "hours":
          now.setHours(now.getHours() + value);
          break;
      case "minutes":
          now.setMinutes(now.getMinutes() + value);
          break;
      case "now":
      default:
          break;
  }

  // 获取格式化后的时间
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // 月份从 0 开始，需要 +1
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}Z`;
}


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
4. If a deadline is mentioned, convert it to an ISO date string relative to now (${formatLocalToISO()})
   - Example: "tomorrow" becomes "${formatLocalToISO('tomorrow')}"
   - Example: "next week" becomes "${formatLocalToISO('nextweek')}"
   - Example: "in 3 days" becomes "${formatLocalToISO('days', 3)}"
   - Example: "in 5 hours" becomes "${formatLocalToISO('hours', 5)}"
   - Example: "in 30 minutes" becomes "${formatLocalToISO('minutes', 30)}"

5. ALWAYS USE TIME FOR TODAY AS REFERENCE
TIME FOR TODAY: ${formatLocalToISO()}

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
    console.log(formatLocalToISO());
    if (!description || typeof description !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid request: description is required and must be a string' 
      });
    }

    // **示例调用**
    console.log("Now:", formatLocalToISO());                // 当前时间
    console.log("Tomorrow:", formatLocalToISO("tomorrow")); // 明天
    console.log("Next Week:", formatLocalToISO("nextweek")); // 下周
    console.log("Next Month:", formatLocalToISO("nextmonth")); // 下个月
    console.log("In 5 Days:", formatLocalToISO("days", 5));  // 5天后
    console.log("In 2 Weeks:", formatLocalToISO("weeks", 2)); // 2周后
    console.log("In 3 Months:", formatLocalToISO("months", 3)); // 3个月后
    console.log("In 4 Hours:", formatLocalToISO("hours", 4)); // 4小时后
    console.log("In 30 Minutes:", formatLocalToISO("minutes", 30)); // 30分钟后

    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-specdec',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: description }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
      max_tokens: 2500
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