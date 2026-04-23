export interface SkillMeta {
  name: string;
  description: string;
}

export interface SkillSection {
  heading: string;
  content: string;
  level: number;
}

export interface DotBlock {
  index: number;
  code: string;
}

export interface ParsedSkill {
  meta: SkillMeta;
  rawContent: string;
  sections: SkillSection[];
  dotBlocks: DotBlock[];
}

export interface TriggerEntry {
  id: string;
  intent: string;
  type: "cron" | "webhook" | "manual" | "chain";
  cron?: string;
  endpoint?: string;
  chainTarget?: string;
  status: "active" | "paused";
}

export interface ExecDetailEntry {
  id: string;
  intent: string;
  prompt: string;
}

export interface CustomData {
  triggers: TriggerEntry[];
  execDetails: ExecDetailEntry[];
  tasks: TaskEntry[];
  tools: string[];
}

export interface TaskEntry {
  id: string;
  name: string;
  triggerType: "cron" | "webhook" | "manual";
  triggerConfig: string;
  instruction: string;
  status: "active" | "paused";
}

export interface ExecutionLog {
  id: string;
  triggered_by: string;
  timestamp: string;
  model: string;
  status: "success" | "failed" | "timeout";
  input_prompt: string;
  output: string;
  duration_ms: number;
  token_usage: { prompt: number; completion: number };
  task_id?: string;
  task_name?: string;
}

export interface EditLog {
  id: string;
  timestamp: string;
  action: string;
  detail: string;
  before: string;
  after: string;
}

export interface HistoryData {
  execution_logs: ExecutionLog[];
  edit_logs: EditLog[];
}

export interface SkillVisibilityEntry {
  visible: boolean;
  automation_enabled: boolean;
}

export interface ApiSettings {
  base_url: string;
  api_key: string;
  model: string;
}

export interface SkillDetail {
  name: string;
  parsed: ParsedSkill;
  custom: CustomData;
  history: HistoryData;
  hasCustom: boolean;
  hasHistory: boolean;
  summary: string | null;
}

export interface SkillOverview {
  name: string;
  summary: string | null;
  tasks: TaskEntry[];
  lastExecution: ExecutionLog | null;
}
