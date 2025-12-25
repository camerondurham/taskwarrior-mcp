export interface Task {
  id?: number;
  uuid?: string;
  description: string;
  status?: string;
  due?: string;
  priority?: string;
  project?: string;
  tags?: string[];
  entry?: string;
  modified?: string;
  end?: string;
  urgency?: number;
}

export interface AddTaskOptions {
  due?: string;
  priority?: string;
  project?: string;
  tags?: string[];
}

export interface ModifyTaskOptions {
  description?: string;
  due?: string;
  priority?: string;
  project?: string;
  tags?: string[];
}
