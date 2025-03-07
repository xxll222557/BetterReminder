import { ApiResponse } from './types';
import OpenAI from 'openai';

// Keywords that indicate high priority
const HIGH_PRIORITY_KEYWORDS = [
  'urgent', 'asap', 'important', 'critical', 'deadline',
  'emergency', 'priority', 'crucial', 'vital', 'immediate'
];

// Keywords that indicate medium priority
const MEDIUM_PRIORITY_KEYWORDS = [
  'soon', 'next week', 'prepare', 'develop', 'create',
  'update', 'modify', 'enhance', 'improve', 'review'
];

// Task complexity indicators
const COMPLEXITY_KEYWORDS = [
  'analyze', 'research', 'design', 'implement', 'coordinate',
  'organize', 'prepare', 'develop', 'create', 'plan'
];

function containsAnyKeyword(text: string, keywords: string[]): boolean {
  return keywords.some(keyword => text.toLowerCase().includes(keyword.toLowerCase()));
}

function countComplexityFactors(description: string): number {
  return COMPLEXITY_KEYWORDS.filter(keyword => 
    description.toLowerCase().includes(keyword.toLowerCase())
  ).length;
}

function generateSummary(description: string): string {
  // Capitalize first letter and add proper punctuation
  let summary = description.charAt(0).toUpperCase() + description.slice(1);
  if (!summary.endsWith('.')) {
    summary += '.';
  }
  
  // Add context based on keywords
  if (containsAnyKeyword(description, HIGH_PRIORITY_KEYWORDS)) {
    summary += ' This task requires immediate attention.';
  } else if (containsAnyKeyword(description, MEDIUM_PRIORITY_KEYWORDS)) {
    summary += ' This task should be addressed in the near future.';
  }

  return summary;
}

function calculateEstimatedTime(description: string): string {
  const complexityScore = countComplexityFactors(description);
  const wordCount = description.split(' ').length;
  
  // Base time calculation
  let baseHours = 0.5; // Start with 30 minutes
  
  // Add time based on complexity
  baseHours += complexityScore * 0.5;
  
  // Add time based on description length
  baseHours += Math.floor(wordCount / 10) * 0.25;
  
  // Adjust for priority keywords
  if (containsAnyKeyword(description, HIGH_PRIORITY_KEYWORDS)) {
    baseHours *= 1.2; // 20% more time for urgent tasks (they often need extra attention)
  }
  
  // Format the time estimate
  if (baseHours < 1) {
    return `${Math.ceil(baseHours * 60)} minutes`;
  } else if (baseHours === 1) {
    return '1 hour';
  } else {
    return `${Math.ceil(baseHours)} hours`;
  }
}

function determinePriority(description: string): 'High' | 'Medium' | 'Low' {
  if (containsAnyKeyword(description, HIGH_PRIORITY_KEYWORDS)) {
    return 'High';
  } else if (containsAnyKeyword(description, MEDIUM_PRIORITY_KEYWORDS)) {
    return 'Medium';
  }
  return 'Low';
}

// Simulate network delay with random timing
function simulateNetworkDelay(): Promise<void> {
  const MIN_DELAY = 500;
  const MAX_DELAY = 1500;
  const delay = Math.random() * (MAX_DELAY - MIN_DELAY) + MIN_DELAY;
  return new Promise(resolve => setTimeout(resolve, delay));
}

// DeepSeek API configuration
const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com'
});

// System prompt for task analysis
const SYSTEM_PROMPT = `
Analyze the given task description and provide a response in JSON format with the following structure:
{
  "summary": "Brief summary of the task",
  "estimated_time": "Estimated time in format like '2 hours' or '30 minutes'",
  "priority": "High" | "Medium" | "Low"
}`;

export async function analyzeTask(description: string): Promise<ApiResponse> {
  if (!process.env.DEEPSEEK_API_KEY) {
    throw new Error('DeepSeek API key not configured');
  }

  try {
    const response = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: description }
      ],
      response_format: {
        type: 'json_object'
      }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('Empty response from DeepSeek API');
    }
    const result = JSON.parse(content);

    return {
      summary: result.summary,
      estimatedTime: result.estimated_time,
      priority: result.priority as 'High' | 'Medium' | 'Low'
    };
  } catch (error) {
    console.error('DeepSeek API error:', error);
    throw new Error('Failed to analyze task with DeepSeek API');
  }
}