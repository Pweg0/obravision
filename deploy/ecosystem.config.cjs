module.exports = {
  apps: [
    {
      name: "obravision-web",
      cwd: "./apps/web",
      script: "node_modules/.bin/next",
      args: "start -p 3000",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: "512M",
    },
    {
      name: "obravision-api",
      cwd: "./apps/api",
      script: "dist/app.js",
      env: {
        NODE_ENV: "production",
        PORT: 4000,
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: "256M",
    },
  ],
}
