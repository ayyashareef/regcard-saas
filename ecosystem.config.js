module.exports = {
  apps: [
    {
      name: "regcard",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3003",
      cwd: "/var/www/regcard",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3003,
      },
      max_memory_restart: "500M",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "./logs/error.log",
      out_file: "./logs/out.log",
      merge_logs: true,
    },
  ],
};
