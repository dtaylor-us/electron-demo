const {app} = require('electron');
const childProcess = require('child_process');

const JAVA_PATH = 'java';
const WIN_PLATFORM = 'win32';
// const JAR = __dirname + '/dist/rest-service/rest-service-0.0.1-SNAPSHOT.jar';
const JAR_PATH = `/dist${process.env.SPRANGTRON_JAR}`;
const JAR = __dirname + JAR_PATH;
const APP_URL = process.env.SPRANGTRON_REST_SERVICE_URL;
// const APP_URL = process.env.APP_URL;
const fs = require('fs');
const path = require('path');

function checkJar() {
  const files = fs.readdirSync(app.getAppPath() + '/dist/rest-service');
  let filename = null;
  for (const i in files) {
    if (path.extname(files[i]) === '.jar') {
      filename = path.basename(files[i]);
      break;
    }
  }
  if (!filename) {
    throw new Error('The Application could not be started');
  }
}

function getServerProcess() {
  console.log('::getting jar-path::'); // DEBUG LOG
  return childProcess.spawn('java', ['-jar', JAR]);
}

function pingServer(serverProcess, callback, maxAttempts) {
  const requestPromise = require('minimal-request-promise');

  function onRejected() {
    return _ => {
      console.log(`ATTEMPTS LEFT::: ${maxAttempts}`);
      if (maxAttempts > 0) {
        setTimeout(function() {
          pingServer(serverProcess, callback, maxAttempts - 1);
        }, 1000);
      } else {
        throw new Error('Unable to connect to server.');
      }
    };
  }

  function onFulfilled(fn) {
    return _ => {
      console.log('Successfully started server!');
      fn();
    };
  }

  requestPromise.get(APP_URL).
    then(onFulfilled(callback), onRejected(maxAttempts)).
    catch((err) => {
      console.error(err);
      serverProcess.kill();
      app.quit();
    });
}

module.exports = class ServerProcess {
  #serverProcess = getServerProcess();
  constructor() {
  }

  kill() {
    if (this.#serverProcess) {
      // kill Java executable
      console.log('killing server');
      this.#serverProcess.kill('SIGINT');
    }
  }

  startServer(callback) {
    console.log('::executing jar::'); // DEBUG LOG
    this.#serverProcess.stdout.on('data', function(data) {
      console.log('Server: ' + data);
    });
    this.#serverProcess.stderr.on('data', (data) => {
      console.error(`${data}`);
      app.quit();
    });
    console.log('Server PID: ' + this.#serverProcess.pid);
    console.log('Waiting for the server start...');
    pingServer(this.#serverProcess, callback, 10);
  };
};
