import { createProxyMiddleware, Options, RequestHandler } from 'http-proxy-middleware';
import { Request, Response } from 'express';

export function createServiceProxy(target: string, name = 'service', opts: Partial<Options> = {}): RequestHandler {
  const options: Options = {
    target,
    changeOrigin: true,
    secure: false,
    proxyTimeout: 10000,
    timeout: 20000,
    logLevel: 'info',
    pathRewrite: (path, req) => {
    return path;
    },
    onProxyReq(proxyReq, req: Request, res: Response) {
      try {
        console.log(`[proxy] -> ${name} : ${req.method} ${req.originalUrl}`);

         // 🔐 Forward userId
        if (req.user?.userId) {
          proxyReq.setHeader('x-user-id', req.user.userId);
        }

          // 🔐 Forward token
        if (req.headers.authorization) {
          proxyReq.setHeader('authorization', req.headers.authorization);
        }

      } catch (e) {
        console.error('ProxyReq error:', e);
      }
    },  
    onProxyRes(proxyRes, req: Request, res: Response) {
      // eslint-disable-next-line no-console
      console.log(`[proxy] <- ${name} : ${req.method} ${req.originalUrl} <= ${proxyRes.statusCode}`);
    },
    onError(err, req: Request, res: Response) {
      // eslint-disable-next-line no-console
      console.error(`[proxy][error] ${name} ${req.method} ${req.originalUrl} -> ${target} :`, err && err.message ? err.message : err);
      if (!res.headersSent) {
        res.statusCode = 502;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: false, message: `${name} unavailable`, data: null, error: 'Service Unavailable' }));
      } else {
        try { res.end(); } catch (_) { /* ignore */ }
      }
    },
    ...opts
  };

  return createProxyMiddleware(options);
}
