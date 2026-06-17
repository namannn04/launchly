module.exports = {
  apps: [
    {
      name: "launchly-web",
      cwd: __dirname + "/..",
      script: "npm",
      args: "run start:prod",
      env: {
        NODE_ENV: "production",
      },
      max_restarts: 10,
      restart_delay: 5000,
    },
    {
      name: "launchly-worker",
      cwd: __dirname + "/..",
      script: "npm",
      args: "run worker:deploy",
      env: {
        NODE_ENV: "production",
      },
      max_restarts: 10,
      restart_delay: 5000,
    },
  ],
};
