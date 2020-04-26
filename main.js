const {app, BrowserWindow} = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');
const childProcess = require('child_process');

let mainWindow = null;

function isDev() {
  return process.mainModule.filename.indexOf('app.asar') === -1;
};

const PLATFORM = process.platform;
const APP_URL = 'http://localhost:8080/greeting';
const WIN_JAVA_PATH = 'java.exe';
const JAVA_PATH = 'java';
const INDEX_FILE = __dirname + '/dist/sprangtron-ui/index.html';
const JAR_FILE = __dirname +
  '/dist/rest-service/rest-service-0.0.1-SNAPSHOT.jar';
const WIN_PLATFORM = 'win32';

let javaVMParameters = []; //['-Dserver.port=' + port, '-Dtest=test'];

let serverProcess;

function getServerProcess() {
  console.log('::getting server process::'); // DEBUG LOG
  if (PLATFORM === WIN_PLATFORM) {
    return childProcess.spawn('cmd.exe', ['/c', 'demo.bat'],
      {
        cwd: app.getAppPath() + '/demo/bin',
      });
  } else {
    return childProcess.spawn(app.getAppPath() + '/demo/bin/demo');
  }
}

const getJavaPath = () => {
  console.log('::getting java path::'); // DEBUG LOG
  if (PLATFORM === WIN_PLATFORM) {
    return WIN_JAVA_PATH;
  } else {
    return JAVA_PATH;
  }
};

function getServerProcessJar() {
  console.log('::getting jar-path::'); // DEBUG LOG
  return childProcess.spawn(getJavaPath(), [
    '-jar', JAR_FILE, {
      cwd: app.getAppPath() + '/electron',
    }],
  );
  // return childProcess.spawn(getJavaPath(),
  //   ['-jar'].concat(javaVMParameters).concat(JAR_FILE), {
  //     cwd: app.getAppPath() + '/electron',
  //   });
}

function createWindow() {
  console.log('::creating window::'); // DEBUG LOG
  serverProcess = getServerProcessJar();

  serverProcess.on('error', (code, signal) => {
    console.log('::error on server process::'); // DEBUG LOG
    setTimeout(function() {
      app.exit();
    }, 1000);
    throw new Error('The Application could not be started');
  });

  console.log('::executing jar::'); // DEBUG LOG
  serverProcess.stdout.on('data', function(data) {
    console.log('Server: ' + data);
  });

  // serverProcess.stdout.on('data', function(data) {
  //   console.log('Server: ' + data);
  // });

  console.log('Server PID: ' + serverProcess.pid);

  const openWindow = () => {
    console.log('::opening window::'); // DEBUG LOG
    let mainWindow = new BrowserWindow({
      title: 'Demo',
      width: 640,
      height: 480,
    });

    console.log('loading url::' + INDEX_FILE); // DEBUG LOG
    mainWindow.loadURL(url.format({
      pathname: INDEX_FILE,
      protocol: 'file',
      slashes: true,
    }));

    mainWindow.on('closed', () => {
      console.log('::window closed::'); // DEBUG LOG
      mainWindow = null;
    });

    mainWindow.on('close', e => {
      console.log('::closing window::'); // DEBUG LOG
      if (serverProcess) {
        e.preventDefault();

        // kill Java executable
        const kill = require('tree-kill');

        // serverProcess.kill();
        kill(serverProcess.pid, 'SIGTERM', function() {
          console.log('::killed java server::'); // DEBUG LOG
          serverProcess = null;
          mainWindow.close();
        });
      }
    });
  };

  const startUp = (count) => {
    const requestPromise = require('minimal-request-promise');

    function onRejected() {
      return response => {
        console.log('Waiting for the server start...');
        setTimeout(function () {
          startUp();
        }, 200);
      };
    }

    function onFulfilled() {
      return response => {
        console.log('Server started!');
        openWindow();
      };
    }

    requestPromise.get(APP_URL).then(onFulfilled(), onRejected());

  };
  startUp(20);
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  console.log('::all windows closed::'); // DEBUG LOG
  if (PLATFORM !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  console.log('::activate::'); // DEBUG LOG
  if (mainWindow === null) {
    createWindow();
  }
});
