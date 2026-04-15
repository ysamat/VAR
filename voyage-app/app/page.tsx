import { CinematicOverlay } from "@/components/CinematicOverlay";
import { ExperienceFlow } from "@/components/ExperienceFlow";

export default function HomePage() {
  return (
    <main className="relative min-h-screen w-full overflow-x-hidden overflow-y-auto bg-brand-dark">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(251,204,51,0.10),transparent_40%),radial-gradient(circle_at_bottom,_rgba(251,204,51,0.06),transparent_45%)]" />
      <CinematicOverlay />
      <ExperienceFlow />
    </main>
  );
}
