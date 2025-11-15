import { httpServer } from "./http_server/index.js";
import { initWebSocketServer } from './ws_server/index.js';

const HTTP_PORT = 8181;

console.log(`Static http server starts on the ${HTTP_PORT} port.`);
httpServer.listen(HTTP_PORT);

initWebSocketServer(httpServer);
