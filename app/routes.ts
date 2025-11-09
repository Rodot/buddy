import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("api/openai-key", "routes/api.openai-key.ts"),
] satisfies RouteConfig;
