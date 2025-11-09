import type { Route } from "./+types/home";
import FullscreenButton from "~/components/FullscreenButton";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Buddy" }, { name: "description", content: "Buddy app" }];
}

export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Hello, buddy.</p>
      <FullscreenButton />
    </div>
  );
}
