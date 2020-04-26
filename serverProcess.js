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

function pingServer(callback) {
  const requestPromise = require('minimal-request-promise');

  function onRejected() {
    return _ => {
      console.log('Waiting for the server start...');
      setTimeout(function() {
        pingServer(callback);
      }, 200);
    };
  }

  function onFulfilled(fn) {
    return _ => {
      fn();
    };
  }

  requestPromise.get(APP_URL).then(onFulfilled(callback), onRejected());
}

module.exports = class ServerProcess {

  constructor(app, platform) {
    this.platform = platform;
    this.app = app;
  }

  ping(callback) {
    return pingServer(callback)
  }


  startServer() {
    let serverProcess = getServerProcess();
    handleServerProcessError(this.app, serverProcess);
    console.log('::executing jar::'); // DEBUG LOG
    serverProcess.stdout.on('data', function(data) {
      console.log('Server: ' + data);
    });
    console.log('Server PID: ' + serverProcess.pid);
    return serverProcess;
  };
};
