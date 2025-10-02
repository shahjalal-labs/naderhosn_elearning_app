module.exports = {
  apps: [
    {
      name: "server",
      script: "./dist/server.js",
      watch: false,
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "email-worker",
      script: "./dist/workers/email.worker.js",
      watch: false,
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "users-worker",
      script: "./dist/workers/users.worker.js",
      watch: false,
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "notification-worker",
      script: "./dist/workers/notification.worker.js",
      watch: false,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
