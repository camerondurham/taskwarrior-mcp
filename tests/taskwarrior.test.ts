import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { listTasks, addTask, completeTask, modifyTask, getTask } from '../src/taskwarrior.js';

describe('TaskwarriorWrapper', () => {
  let testTaskData: string;

  beforeEach(() => {
    testTaskData = mkdtempSync(join(tmpdir(), 'taskwarrior-test-'));
  });

  afterEach(() => {
    rmSync(testTaskData, { recursive: true, force: true });
  });

  test('listTasks returns empty array for new data', () => {
    const tasks = listTasks(undefined, testTaskData);
    expect(tasks).toEqual([]);
  });

  test('addTask creates task and returns id', () => {
    const id = addTask('Test task', undefined, testTaskData);
    expect(id).toBeGreaterThan(0);
  });

  test('listTasks returns added task', () => {
    addTask('Test task', undefined, testTaskData);
    const tasks = listTasks(undefined, testTaskData);
    expect(tasks.length).toBe(1);
    expect(tasks[0].description).toBe('Test task');
  });

  test('addTask with options', () => {
    const id = addTask('Task with options', {
      due: 'tomorrow',
      priority: 'H',
      project: 'test',
      tags: ['urgent']
    }, testTaskData);
    
    const task = getTask(id, testTaskData);
    expect(task.priority).toBe('H');
    expect(task.project).toBe('test');
    expect(task.tags).toContain('urgent');
  });

  test('completeTask marks task done', () => {
    const id = addTask('Task to complete', undefined, testTaskData);
    completeTask(id, testTaskData);
    
    const task = getTask(id, testTaskData);
    expect(task.status).toBe('completed');
  });

  test('modifyTask changes properties', () => {
    const id = addTask('Task to modify', undefined, testTaskData);
    modifyTask(id, { priority: 'H', project: 'testproject' }, testTaskData);
    
    const task = getTask(id, testTaskData);
    expect(task.priority).toBe('H');
    expect(task.project).toBe('testproject');
  });

  test('getTask returns single task', () => {
    const id = addTask('Single task', undefined, testTaskData);
    const task = getTask(id, testTaskData);
    expect(task.id).toBe(id);
    expect(task.description).toBe('Single task');
  });

  test('getTask throws for invalid id', () => {
    expect(() => getTask(99999, testTaskData)).toThrow();
  });

  test('listTasks with filter', () => {
    addTask('Work task', { project: 'work' }, testTaskData);
    addTask('Home task', { project: 'home' }, testTaskData);
    
    const workTasks = listTasks('project:work', testTaskData);
    expect(workTasks.length).toBe(1);
    expect(workTasks[0].project).toBe('work');
  });
});
