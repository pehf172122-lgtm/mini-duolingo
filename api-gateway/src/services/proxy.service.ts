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
        console.log('[proxy] headers:', req.headers);

         // 🔐 Forward userId
        if (req.user?.userId) {
          proxyReq.setHeader('x-user-id', req.user.userId);
        }

          // 🔐 Forward token
        if (req.headers.authorization) {
          proxyReq.setHeader('authorization', req.headers.authorization);
        }
          // Forward cookies (refresh token cookie)
          if (req.headers.cookie) {
            proxyReq.setHeader('cookie', req.headers.cookie as string);
          }

        // Forward JSON body when express.json() has already parsed it
        try {
          const contentType = (req.headers['content-type'] || '') as string;
          if (req.body !== undefined && proxyReq.write && contentType.includes('application/json')) {
            const bodyData = JSON.stringify(req.body);
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
            try { proxyReq.end(); } catch (_) { /* ignore if already ended */ }
          }
        } catch (e) {
          // ignore body forward errors
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
