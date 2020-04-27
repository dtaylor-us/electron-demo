const childProcess = require('child_process');
const WIN_JAVA_PATH = 'java.exe';
const JAVA_PATH = 'java';
const WIN_PLATFORM = 'win32';
const JAR_FILE = __dirname +
  '/dist/rest-service/rest-service-0.0.1-SNAPSHOT.jar';
const APP_URL = 'http://localhost:8080/greeting';

function getJavaPath() {
  console.log('::getting java path::'); // DEBUG LOG
  if (this.platform === WIN_PLATFORM) {
    return WIN_JAVA_PATH;
  } else {
    return JAVA_PATH;
  }
}

const handleServerProcessError = (app, serverProcess) => {
  serverProcess.on('error', (code, _) => {
    console.log('::error on server process:: ERR:' + code); // DEBUG LOG
    setTimeout(function() {
      app.exit();
    }, 1000);
    throw new Error('The Application could not be started');
  });
};


function getServerProcess() {
  console.log('::getting jar-path::'); // DEBUG LOG
  return childProcess.spawn(getJavaPath(), ['-jar', JAR_FILE]);
}

function pingServer(callback, maxAttempts) {
  const requestPromise = require('minimal-request-promise');

  function onRejected() {
    return _ => {
      console.log(`ATTEMPTS LEFT::: ${maxAttempts}`);
      if(maxAttempts > 0){
        setTimeout(function() {
          pingServer(callback, maxAttempts - 1);
        }, 1000);
      }
    };
  }

  function onFulfilled(fn) {
    return _ => {
      fn();
    };
  }

  requestPromise.get(APP_URL).then(onFulfilled(callback), onRejected(maxAttempts));
}

module.exports = class ServerProcess {

  constructor(app, platform) {
    this.platform = platform;
    this.app = app;
  }

  ping(callback) {
    console.log('Waiting for the server start...');
    return pingServer(callback, 10)
  }

  startServer() {
    let serverProcess = getServerProcess();
    console.log('::executing jar::'); // DEBUG LOG
    serverProcess.stdout.on('data', function(data) {
      console.log('Server: ' + data);
    });
    serverProcess.stderr.on('data', (data) => {
      console.error(`child stderr:\n${data}`);
      this.app.quit();
    });
    console.log('Server PID: ' + serverProcess.pid);
    return serverProcess;
  };
};
