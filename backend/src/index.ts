import { createServer } from "node:http";
import { env } from "./config/env.js";
import { createApp } from "./app.js";
import { attachSocket } from "./socket/index.js";

const app = createApp();
const httpServer = createServer(app);
const io = attachSocket(httpServer);
app.set("io", io);

httpServer.listen(env.PORT, () => {
  console.log(`API + Socket.IO on http://localhost:${env.PORT}`);
});
