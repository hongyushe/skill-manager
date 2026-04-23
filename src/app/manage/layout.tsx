import SkillList from "@/components/SkillList";
import { listSkills } from "@/lib/storage";

export default async function ManageLayout({ children }: { children: React.ReactNode }) {
  const skills = await listSkills();
  return (
    <div className="flex min-h-screen">
      <SkillList skills={skills} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
