import { Router } from 'express';
import { register } from '../observability/metrics.js';

const router = Router();

router.get('/', async (req, res) => {
  // Optional token protection for metrics
  const authToken = process.env.METRICS_AUTH_TOKEN;
  if (authToken) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || authHeader !== `Bearer ${authToken}`) {
      return res.status(401).send('Unauthorized metrics scrape');
    }
  }

  try {
    res.setHeader('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.send(metrics);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

export default router;
