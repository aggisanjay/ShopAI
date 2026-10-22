import crypto from 'crypto';
import { runWithContext } from '../utils/context.js';
import logger from '../utils/logger.js';
import { httpRequestDurationMicroseconds, httpRequestsTotal, httpErrorsTotal } from '../observability/metrics.js';

export const tracingMiddleware = (req, res, next) => {
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  const traceId = req.headers['x-trace-id'] || req.headers['traceparent'] || crypto.randomUUID();

  // Attach to request and response
  req.id = requestId;
  req.traceId = traceId;
  res.setHeader('X-Request-Id', requestId);
  res.setHeader('X-Trace-Id', traceId);

  const startTime = process.hrtime();
  const context = {
    requestId,
    traceId,
    clientIp: req.ip || req.connection?.remoteAddress,
  };

  runWithContext(context, () => {
    // Intercept finish event to log structured response metrics
    res.on('finish', () => {
      const diff = process.hrtime(startTime);
      const durationMs = (diff[0] * 1e3 + diff[1] * 1e-6);
      const durationSeconds = durationMs / 1000;
      const statusCode = res.statusCode;

      // Normalize route pattern for metric low-cardinality label
      const routePath = req.baseUrl ? `${req.baseUrl}${req.route?.path || req.path || ''}` : (req.route?.path || req.path || 'unknown');
      const normalizedRoute = routePath.replace(/\/[a-f0-9]{24}\b/gi, '/:id');

      // Record Prometheus metrics
      try {
        httpRequestsTotal.inc({
          method: req.method,
          route: normalizedRoute,
          status_code: statusCode,
        });

        httpRequestDurationMicroseconds.observe(
          {
            method: req.method,
            route: normalizedRoute,
            status_code: statusCode,
          },
          durationSeconds
        );

        if (statusCode >= 400) {
          const errorType = statusCode >= 500 ? 'server_error' : (statusCode === 429 ? 'rate_limit' : (statusCode === 401 || statusCode === 403 ? 'auth_error' : 'client_error'));
          httpErrorsTotal.inc({
            method: req.method,
            route: normalizedRoute,
            error_type: errorType,
          });
        }
      } catch (err) {
        // Do not fail request logging on metric recording failure
      }

      const logPayload = {
        requestId,
        traceId,
        method: req.method,
        url: req.originalUrl || req.url,
        route: normalizedRoute,
        statusCode,
        durationMs: Math.round(durationMs * 100) / 100,
        contentLength: res.get('content-length') || 0,
        userAgent: req.get('user-agent'),
        ip: context.clientIp,
        userId: req.user?._id?.toString() || req.user?.id || undefined,
      };

      if (statusCode >= 500) {
        logger.error(`HTTP ${req.method} ${req.originalUrl} ${statusCode} in ${durationMs.toFixed(1)}ms`, logPayload);
      } else if (statusCode >= 400) {
        logger.warn(`HTTP ${req.method} ${req.originalUrl} ${statusCode} in ${durationMs.toFixed(1)}ms`, logPayload);
      } else {
        logger.info(`HTTP ${req.method} ${req.originalUrl} ${statusCode} in ${durationMs.toFixed(1)}ms`, logPayload);
      }
    });

    next();
  });
};
