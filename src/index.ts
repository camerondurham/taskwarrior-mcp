#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { listTasks, addTask, completeTask, modifyTask, getTask } from './taskwarrior.js';

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
        description: 'List tasks with optional filter (e.g., "due:today", "+work", "project:hoth")',
        inputSchema: {
          type: 'object',
          properties: {
            filter: {
              type: 'string',
              description: 'Optional Taskwarrior filter expression',
            },
          },
        },
      },
      {
        name: 'add_task',
        description: 'Add a new task with description and optional properties',
        inputSchema: {
          type: 'object',
          properties: {
            description: {
              type: 'string',
              description: 'Task description',
            },
            due: {
              type: 'string',
              description: 'Due date (e.g., "tomorrow", "2024-12-31", "eom")',
            },
            priority: {
              type: 'string',
              description: 'Priority: H (high), M (medium), or L (low)',
            },
            project: {
              type: 'string',
              description: 'Project name',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of tags',
            },
          },
          required: ['description'],
        },
      },
      {
        name: 'complete_task',
        description: 'Mark a task as done',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              description: 'Task ID',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'modify_task',
        description: 'Modify task properties',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              description: 'Task ID',
            },
            description: {
              type: 'string',
              description: 'New description',
            },
            due: {
              type: 'string',
              description: 'New due date',
            },
            priority: {
              type: 'string',
              description: 'New priority: H, M, or L',
            },
            project: {
              type: 'string',
              description: 'New project name',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'New tags',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'get_task',
        description: 'Get details of a single task by ID',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              description: 'Task ID',
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
