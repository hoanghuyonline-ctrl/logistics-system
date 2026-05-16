module.exports = {
  apps: [
    {
      name: "logistics-system",
      script: ".next/standalone/server.js",
      cwd: "D:\\BacTrungHai\\logistics-system",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "0.0.0.0",
      },
      max_restarts: 10,
      min_uptime: "10s",
      restart_delay: 5000,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "logs/error.log",
      out_file: "logs/out.log",
      merge_logs: true,
    },
  ],
};
