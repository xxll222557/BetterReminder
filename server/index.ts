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
- "tomorrow afternoon three" => "2024-03-10T15:00:00+08:00"
- "today evening eight" => "2024-03-09T20:00:00+08:00"
- "Two hours later" => [Current time + 2 hours]

Please make sure the returned time contains the correct time zone information (+08:00 means Beijing time)

Time processing rules:
1. Current date: ${new Date().toISOString().split('T')[0]}
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
Today is ${new Date().toISOString().split('T')[0]}, then:
- "Tomorrow 12:00" => "${new Date(Date.now() + 86400000).toISOString().split('T')[0]}T12:00:00+08:00"
- "Today at 3pm" => "${new Date().toISOString().split('T')[0]}T15:00:00+08:00"

Please ensure that all returned times:
1. Contain the correct year (current year)
2. Use the full ISO format
3. Contain China time zone information (+08:00)
4. Future times are not mistakenly judged as past times

Format the response as a JSON object, with each task containing the following fields:
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