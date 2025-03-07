import { ApiResponse } from './types';

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

// Mock API function to simulate DeepSeek API response
export async function analyzeTask(description: string): Promise<ApiResponse> {
  // Simulate network delay
  await simulateNetworkDelay();
  
  // Simulate API failure occasionally (1% chance)
  if (Math.random() < 0.01) {
    throw new Error('API request failed');
  }

  return {
    summary: generateSummary(description),
    estimatedTime: calculateEstimatedTime(description),
    priority: determinePriority(description)
  };
}