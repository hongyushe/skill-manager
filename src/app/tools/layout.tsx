import SkillList from "@/components/SkillList";
import { listSkills } from "@/lib/storage";

export default async function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const skills = await listSkills();
  return (
    <div className="flex min-h-screen">
      <SkillList skills={skills} />
      {children}
    </div>
  );
}
