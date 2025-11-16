import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';

export const httpServer = http.createServer(function (
  req: http.IncomingMessage,
  res: http.ServerResponse
) {
  const requestedUrl = req.url === '/' ? '/index.html' : (req.url || '');
  const safeRelativePath = path.normalize(path.join('/front', requestedUrl))
                                    .replace(/^(\.\.[\/\\])+/, '');
  const projectRoot = path.resolve(__dirname, '../../');
  const file_path = path.join(projectRoot, safeRelativePath);

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
