import type { Route } from "./+types/home";
import VoiceAgent from "~/components/VoiceAgent";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Buddy" }, { name: "description", content: "Buddy app" }];
}

export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <VoiceAgent />
    </div>
  );
}
