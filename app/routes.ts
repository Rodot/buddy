import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/connect.tsx"),
  route("chat", "routes/chat.tsx"),
  route("api/openai-key", "routes/api.openai-key.ts"),
  route("api/completion", "routes/api.completion.ts"),
] satisfies RouteConfig;
