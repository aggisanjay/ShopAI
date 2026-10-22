/**
 * ShopAI Repeatable Load-Test & Latency Benchmark Script
 * Tests normal load, peak load, and measure p50, p95, p99, throughput, and error rates.
 */

const BASE_URL = process.env.TARGET_URL || 'http://localhost:5000';

const ENDPOINTS = [
  { name: 'Health Live', path: '/health/live' },
  { name: 'Health Ready', path: '/health/ready' },
  { name: 'Health Detailed', path: '/health' },
  { name: 'Prometheus Metrics', path: '/metrics' },
  { name: 'Product Listing', path: '/api/products' },
  { name: 'Product Filter Category', path: '/api/products?category=electronics' },
  { name: 'Product Search', path: '/api/products/search?q=phone' },
  { name: 'Featured Products', path: '/api/products/featured' },
  { name: 'Trending Products', path: '/api/products/trending' },
  { name: 'Category Navigation', path: '/api/categories' },
  { name: 'Trending Recommendations', path: '/api/recommendations/trending' },
];

async function runScenario(scenarioName, concurrency = 5, totalRequests = 50) {
  console.log(`\n============================================================`);
  console.log(`🚀 SCENARIO: ${scenarioName} (Concurrency: ${concurrency}, Requests: ${totalRequests})`);
  console.log(`============================================================`);

  const results = [];

  for (const ep of ENDPOINTS) {
    const latencies = [];
    let errors = 0;
    let bytesReceived = 0;

    const executeBatch = async (batchSize) => {
      const promises = Array.from({ length: batchSize }, async () => {
        const start = performance.now();
        try {
          const res = await fetch(`${BASE_URL}${ep.path}`, {
            headers: { 'Accept': 'application/json' },
          });
          const text = await res.text();
          const duration = performance.now() - start;
          latencies.push(duration);
          bytesReceived += text.length;
          if (!res.ok) errors++;
        } catch {
          const duration = performance.now() - start;
          latencies.push(duration);
          errors++;
        }
      });
      await Promise.all(promises);
    };

    const overallStart = performance.now();
    for (let i = 0; i < totalRequests; i += concurrency) {
      const currentBatch = Math.min(concurrency, totalRequests - i);
      await executeBatch(currentBatch);
    }
    const overallDurationSec = (performance.now() - overallStart) / 1000;

    latencies.sort((a, b) => a - b);
    const p50 = latencies[Math.floor(latencies.length * 0.50)] || 0;
    const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
    const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;
    const reqPerSec = totalRequests / overallDurationSec;

    results.push({
      endpoint: ep.name,
      path: ep.path,
      requests: totalRequests,
      errors,
      errorRate: `${((errors / totalRequests) * 100).toFixed(1)}%`,
      p50_ms: p50.toFixed(1),
      p95_ms: p95.toFixed(1),
      p99_ms: p99.toFixed(1),
      throughput_rps: reqPerSec.toFixed(1),
      avg_payload_bytes: Math.round(bytesReceived / totalRequests),
    });
  }

  console.table(results);
  return results;
}

async function main() {
  console.log(`Connecting to target: ${BASE_URL}`);

  try {
    const check = await fetch(`${BASE_URL}/health`);
    if (!check.ok) {
      console.error(`Target not responding with 200 OK. Status: ${check.status}`);
      process.exit(1);
    }
  } catch (err) {
    console.error(`Target unreachable: ${err.message}`);
    process.exit(1);
  }

  // 1. Warm-up & Cache priming
  await runScenario('Warm-up & Cache Priming', 2, 10);

  // 2. Normal Load Test
  await runScenario('Normal Load (Concur: 5, Total: 50)', 5, 50);

  // 3. Peak Load Test
  await runScenario('Peak Burst (Concur: 15, Total: 75)', 15, 75);

  console.log('\n✅ Load test run completed successfully.');
}

main().catch(console.error);
