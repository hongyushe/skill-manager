import { SkillMeta, SkillSection, DotBlock, ParsedSkill } from "./types";

function parseFrontmatter(raw: string): { meta: SkillMeta; body: string } {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("---")) {
    return { meta: { name: "", description: "" }, body: raw };
  }
  const end = trimmed.indexOf("---", 3);
  if (end === -1) {
    return { meta: { name: "", description: "" }, body: raw };
  }
  const frontmatter = trimmed.slice(3, end).trim();
  const body = trimmed.slice(end + 3).trim();

  const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
  const descMatch = frontmatter.match(/^description:\s*["']?(.+?)["']?\s*$/m);

  return {
    meta: {
      name: nameMatch ? nameMatch[1].trim() : "",
      description: descMatch ? descMatch[1].trim() : "",
    },
    body,
  };
}

function parseSections(body: string): SkillSection[] {
  const sections: SkillSection[] = [];
  const lines = body.split("\n");
  let currentHeading = "";
  let currentContent: string[] = [];
  let currentLevel = 0;

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,4})\s+(.+)/);
    if (headingMatch) {
      if (currentHeading) {
        sections.push({
          heading: currentHeading,
          content: currentContent.join("\n").trim(),
          level: currentLevel,
        });
      }
      currentHeading = headingMatch[2].trim();
      currentLevel = headingMatch[1].length;
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }
  if (currentHeading) {
    sections.push({
      heading: currentHeading,
      content: currentContent.join("\n").trim(),
      level: currentLevel,
    });
  }
  return sections;
}

function extractDotBlocks(content: string): DotBlock[] {
  const blocks: DotBlock[] = [];
  const regex = /```dot\n([\s\S]*?)```/g;
  let match;
  let index = 0;
  while ((match = regex.exec(content)) !== null) {
    blocks.push({ index: index++, code: match[1].trim() });
  }
  return blocks;
}

export function parseSkill(content: string): ParsedSkill {
  const { meta, body } = parseFrontmatter(content);
  const sections = parseSections(body);
  const dotBlocks = extractDotBlocks(body);
  return { meta, rawContent: content, sections, dotBlocks };
}
