module.exports = {
  apps: [
    {
      name: "projetapro-web",
      cwd: "/home/projetapro/app/apps/web",
      script: "node_modules/.bin/next",
      args: "start -p 3000",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "512M",
    },
    {
      name: "projetapro-api",
      cwd: "/home/projetapro/app",
      script: "node",
      args: "--import tsx apps/api/src/app.ts",
      env: {
        NODE_ENV: "production",
        PORT: 4000,
      },
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "256M",
    },
  ],
}
