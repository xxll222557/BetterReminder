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
1. Create a clear summary that captures the essential action
2. Estimate the time required to complete it
3. Assign a priority level based on urgency and importance:
   - High: Urgent and important; must be done soon
   - Medium: Important but not urgent
   - Low: Neither urgent nor important

When time periods are mentioned, include them in the task summary in parentheses. Convert vague time references (e.g., "EOD", "next week") into specific timeframes.

Format the response as JSON:
{
  "tasks": [
    {
      "summary": "Individual task summary (include time period if specified)",
      "estimated_time": "Duration in hours/minutes",
      "priority": "High/Medium/Low"
    }
  ]
}

Example input: "Create a presentation for the meeting tomorrow and send invites to all participants, finish before noon"
Example output:
{
  "tasks": [
    {
      "summary": "Create presentation for the meeting (Tomorrow before 12PM)",
      "estimated_time": "2 hours",
      "priority": "High"
    },
    {
      "summary": "Send meeting invites to participants (Tomorrow before 12PM)",
      "estimated_time": "15 minutes",
      "priority": "Medium"
    }
  ]
}`;

const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com/v1'
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
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: description }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 1000
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
      if (!task.summary || !task.estimated_time || !task.priority) {
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