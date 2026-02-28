import Redis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

const testRedis = async (useTLS) => {
  console.log(`\nTesting Redis connection (TLS: ${useTLS ? 'ON' : 'OFF'})...`);
  const client = new Redis({
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD,
    tls: useTLS ? {} : undefined,
    connectTimeout: 5000,
    retryStrategy: () => null,
    lazyConnect: true, // Crucial for manual connect() call
  });

  try {
    await client.connect();
    console.log('✅ Connection successful!');
    await client.set('test_key', 'Hello Redis!');
    const val = await client.get('test_key');
    console.log(`✅ Set/Get successful: ${val}`);
    await client.quit();
    return true;
  } catch (err) {
    console.error(`❌ Connection failed: ${err.message}`);
    try { client.disconnect(); } catch {}
    return false;
  }
};

const run = async () => {
  console.log('--- Diagnosis Start ---');
  console.log(`Host: ${process.env.REDIS_HOST}`);
  console.log(`Port: ${process.env.REDIS_PORT}`);
  
  console.log('Step 1: Testing WITHOUT TLS...');
  const withoutTLS = await testRedis(false);
  
  console.log('\nStep 2: Testing WITH TLS...');
  const withTLS = await testRedis(true);
  
  if (withTLS && !withoutTLS) {
    console.log('\nCONCLUSION: Your Redis provider (Upstash) requires TLS. You must add "tls: {}" to your Redis config.');
  } else if (!withTLS && !withoutTLS) {
    console.log('\nCONCLUSION: Both failed. Please check your credentials or network rules.');
  } else {
    console.log('\nCONCLUSION: Unexpected result. Check details above.');
  }
  console.log('--- Diagnosis End ---');
};

run();
