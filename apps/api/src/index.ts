import express from "express";

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.get("/health", (_request, response) => {
  response.json({
    service: "philip-threadbot-api",
    status: "ok"
  });
});

app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
});
