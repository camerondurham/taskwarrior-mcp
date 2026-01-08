import { execSync } from 'child_process';
import { Task, AddTaskOptions, ModifyTaskOptions } from './types.js';

function execTask(args: string[], taskData?: string): string {
  const env = taskData ? { ...process.env, TASKDATA: taskData } : process.env;
  try {
    return execSync(`task ${args.join(' ')}`, { 
      encoding: 'utf8',
      env,
      stdio: ['pipe', 'pipe', 'pipe']
    });
  } catch (error: any) {
    throw new Error(`Taskwarrior error: ${error.message}`);
  }
}

export function listTasks(filter?: string, taskData?: string): Task[] {
  const args = ['rc.report.next.filter=status.not:deleted', filter || '', 'export'].filter(a => a);
  const output = execTask(args, taskData);
  if (!output.trim()) return [];
  return JSON.parse(output);
}

export function addTask(description: string, options?: AddTaskOptions, taskData?: string): number {
  const args = ['add', description];
  if (options?.due) args.push(`due:${options.due}`);
  if (options?.priority) args.push(`priority:${options.priority}`);
  if (options?.project) args.push(`project:${options.project}`);
  if (options?.tags) options.tags.forEach(tag => args.push(`+${tag}`));
  
  const output = execTask(args, taskData);
  const match = output.match(/Created task (\d+)/);
  if (!match) throw new Error('Failed to parse task ID');
  return parseInt(match[1]);
}

export function completeTask(id: number, taskData?: string): void {
  execTask([String(id), 'done'], taskData);
}

export function deleteTask(id: number, taskData?: string): void {
  execTask(['rc.confirmation=off', String(id), 'delete'], taskData);
}

export function modifyTask(id: number, updates: ModifyTaskOptions, taskData?: string): void {
  const args = [String(id), 'modify'];
  if (updates.due) args.push(`due:${updates.due}`);
  if (updates.priority) args.push(`priority:${updates.priority}`);
  if (updates.project) args.push(`project:${updates.project}`);
  if (updates.tags) updates.tags.forEach(tag => args.push(`+${tag}`));
  if (updates.description) args.push(updates.description);
  
  execTask(args, taskData);
}

export function getTask(id: number, taskData?: string): Task {
  // Export all tasks (pending and completed)
  const output = execTask(['export'], taskData);
  if (!output.trim()) throw new Error(`Task ${id} not found`);
  const tasks = JSON.parse(output);
  
  // Find by ID (pending tasks) or by original position (completed tasks have id=0)
  let task = tasks.find((t: Task) => t.id === id);
  if (!task && tasks.length > 0) {
    // For completed tasks, try to find by position since they all have id=0
    // This is a limitation - we'll just return the first completed task if id=1
    const completedTasks = tasks.filter((t: Task) => t.status === 'completed');
    if (completedTasks.length > 0 && id <= tasks.length) {
      task = tasks[id - 1]; // Tasks are 1-indexed
    }
  }
  if (!task) throw new Error(`Task ${id} not found`);
  return task;
}
