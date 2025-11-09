import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Buddy" }, { name: "description", content: "Buddy app" }];
}

export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Hello, buddy.</p>
    </div>
  );
}
