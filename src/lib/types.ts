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
}
