/**
 * PM2 ecosystem — chạy từ thư mục repo (cwd = __dirname)
 *
 * Usage (trong thư mục project):
 *   pm2 start ecosystem.config.cjs --env production
 *   pm2 reload ecosystem.config.cjs --env production
 *   pm2 save
 */
module.exports = {
  apps: [
    {
      name: 'erp-platform-api',
      cwd: __dirname,
      script: './dist/src/main.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env_production: {
        NODE_ENV: 'production',
      },
      merge_logs: true,
      time: true,
    },
  ],
};
