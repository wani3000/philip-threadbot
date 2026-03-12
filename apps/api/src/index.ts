import express from "express";
import { env } from "./config/env";
import {
  AuthenticatedRequest,
  requireAdminAuth
} from "./middleware/auth";

const app = express();
const port = env.PORT;

app.get("/health", (_request, response) => {
  response.json({
    service: "philip-threadbot-api",
    status: "ok",
    environment: env.NODE_ENV
  });
});

app.get(
  "/admin/health",
  requireAdminAuth,
  (request: AuthenticatedRequest, response) => {
    response.json({
      service: "philip-threadbot-api",
      status: "ok",
      admin: request.adminUser
    });
  }
);

app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
});
