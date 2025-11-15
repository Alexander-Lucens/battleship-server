import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname_corrected = path.dirname(__filename);

export const httpServer = http.createServer(function (
  req: http.IncomingMessage,
  res: http.ServerResponse
) {
  const projectRoot = path.resolve(__dirname_corrected, '../../');
  const file_path = projectRoot + (req.url === '/' ? '/front/index.html' : '/front' + req.url);

  fs.readFile(file_path, function (err, data) {
    if (err) {
      res.writeHead(404);
      res.end(JSON.stringify(err));
      return;
    }
    res.writeHead(200);
    res.end(data);
  });
});
