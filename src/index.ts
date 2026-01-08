#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { listTasks, addTask, completeTask, deleteTask, modifyTask, getTask } from './taskwarrior.js';

const server = new Server(
  {
    name: 'taskwarrior-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'list_tasks',
        description: 'List tasks from the user\'s Taskwarrior task management system. Supports filters like "due:today" for today\'s tasks, "due.before:tomorrow" for overdue/today, "+tagname" for tagged tasks, "project:name" for project tasks, or "status:pending" for incomplete tasks.',
        inputSchema: {
          type: 'object',
          properties: {
            filter: {
              type: 'string',
              description: 'Optional Taskwarrior filter expression (e.g., "due:today", "status:pending", "+tag")',
            },
          },
        },
      },
      {
        name: 'add_task',
        description: 'Add a new task to the user\'s Taskwarrior task list with description and optional due date, priority, project, and tags',
        inputSchema: {
          type: 'object',
          properties: {
            description: {
              type: 'string',
              description: 'Task description',
            },
            due: {
              type: 'string',
              description: 'Due date - supports natural language like "tomorrow", "eom" (end of month), "eoy" (end of year), or ISO dates like "2024-12-31"',
            },
            priority: {
              type: 'string',
              description: 'Priority: H (high), M (medium), or L (low)',
            },
            project: {
              type: 'string',
              description: 'Project name to organize related tasks',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of tags for categorization',
            },
          },
          required: ['description'],
        },
      },
      {
        name: 'complete_task',
        description: 'Mark a task as completed/done in the user\'s Taskwarrior task list',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              description: 'Task ID from list_tasks output',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'delete_task',
        description: 'Delete a task from the user\'s Taskwarrior task list',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              description: 'Task ID to delete',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'modify_task',
        description: 'Modify an existing task\'s properties (due date, priority, project, tags, description) in the user\'s Taskwarrior task list',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              description: 'Task ID to modify',
            },
            description: {
              type: 'string',
              description: 'New task description',
            },
            due: {
              type: 'string',
              description: 'New due date (supports natural language like "tomorrow" or ISO dates)',
            },
            priority: {
              type: 'string',
              description: 'New priority: H (high), M (medium), or L (low)',
            },
            project: {
              type: 'string',
              description: 'New project name',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'New tags (replaces existing tags)',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'get_task',
        description: 'Get detailed information about a specific task from the user\'s Taskwarrior task list by ID',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              description: 'Task ID to retrieve',
            },
          },
          required: ['id'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'list_tasks': {
        const tasks = listTasks(args?.filter as string | undefined);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(tasks, null, 2),
            },
          ],
        };
      }

      case 'add_task': {
        const id = addTask(args?.description as string, {
          due: args?.due as string | undefined,
          priority: args?.priority as string | undefined,
          project: args?.project as string | undefined,
          tags: args?.tags as string[] | undefined,
        });
        return {
          content: [
            {
              type: 'text',
              text: `Created task ${id}`,
            },
          ],
        };
      }

      case 'complete_task': {
        completeTask(args?.id as number);
        return {
          content: [
            {
              type: 'text',
              text: `Completed task ${args?.id}`,
            },
          ],
        };
      }

      case 'delete_task': {
        deleteTask(args?.id as number);
        return {
          content: [
            {
              type: 'text',
              text: `Deleted task ${args?.id}`,
            },
          ],
        };
      }

      case 'modify_task': {
        const { id, ...updates } = args as any;
        modifyTask(id, updates);
        return {
          content: [
            {
              type: 'text',
              text: `Modified task ${id}`,
            },
          ],
        };
      }

      case 'get_task': {
        const task = getTask(args?.id as number);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(task, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
