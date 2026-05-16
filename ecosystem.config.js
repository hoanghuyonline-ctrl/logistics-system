module.exports = {
  apps: [
    {
      name: "logistics-system",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000 -H 0.0.0.0",
      cwd: "D:\\BacTrungHai\\logistics-system",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
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
