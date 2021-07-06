const spawn = require("child_process").spawn;
const chokidar = require("chokidar");

module.exports = ({ tenantDir, command }) => {
  let spawnedProcess = "";
  let watcher = null;
  const watch = () => {
    watcher = chokidar.watch([`${tenantDir}`], {
      ignoreInitial: true,
    });

    let serve = executeServe();

    watcher
      .on("add", () => {
        queueWatch(serve);
      })
      .on("unlink", () => {
        queueWatch(serve);
      });
  };

  let watchTimer = null;
  function queueWatch(serve) {
    console.log("queue watcher");
    spawnedProcess.kill();
    if (watchTimer) {
      clearTimeout(watchTimer);
    }
    watchTimer = setTimeout(() => {
      console.log("rebuilding");
      serve = executeServe();
    }, 2000);
  }

  function executeServe() {
    let cmd = `vue-cli-service`;

    // if windows operating system
    if (process.platform === 'win32') {
      cmd = `${process.cwd()}\\node_modules\\.bin\\vue-cli-service.cmd`
    }

    spawnedProcess = spawn(cmd, [command], {
      env: {
        ...process.env,
      },
      stdio: "inherit",
      detached: true,
    });

    spawnedProcess.on('error', (e) => console.error(e))

    return spawnedProcess;
  }

  function exitHandler(options) {
    if (watchTimer) {
      clearTimeout(watchTimer);
    }
    if (watcher) {
      watcher.close();
    }
    if (options.exit) {
      spawnedProcess.kill();
      process.exit();
    }
  }

  watch();

  process.on("exit", exitHandler.bind(null, { cleanup: true }));

  process.on("SIGINT", exitHandler.bind(null, { exit: true }));

  process.on("SIGUSR1", exitHandler.bind(null, { exit: true }));
  process.on("SIGUSR2", exitHandler.bind(null, { exit: true }));
  process.once("SIGTERM", exitHandler.bind(null, { exit: true }));

  process.on("uncaughtException", function (err) {
    console.error(
      new Date().toUTCString() + " uncaughtException:",
      err.message
    );
    console.error(err.stack);
    process.exit(1);
  });
};
