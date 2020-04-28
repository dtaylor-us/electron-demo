const {app} = require('electron');
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
      } else {
        throw new Error('Unable to connect to server.')
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

  constructor(platform) {
    this.platform = platform;
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
      app.quit();
    });
    console.log('Server PID: ' + serverProcess.pid);
    return serverProcess;
  };
};
