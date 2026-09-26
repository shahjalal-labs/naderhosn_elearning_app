import Redis from "ioredis";

const redisHost = process.env.REDIS_HOST || "127.0.0.1";
const redisPort = Number(process.env.REDIS_PORT) || 6379;
const redisPassword = process.env.REDIS_PASSWORD || undefined;

const redisClient = new Redis({
  host: redisHost,
  port: redisPort,
  password: redisPassword,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,
  retryStrategy: (times) => {
    if (times > 5) {
      return 10000;
    }
    return Math.min(times * 500, 3000);
  },
});

redisClient.connect().catch((err) => {
  console.warn("⚠️ Redis initial connection failed:", err.message);
});

redisClient.on("connect", () => {
  console.log("✅ Redis connected successfully");
});

redisClient.on("error", (err) => {
  console.warn("⚠️ Redis connection error:", err.message);
});

export default redisClient;

