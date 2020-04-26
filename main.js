const {app, BrowserWindow} = require('electron');
const path = require('path');
const url = require('url');
const childProcess = require('child_process');
const ServerProcess = require('./ServerProcess');
const isDev = require('electron-is-dev');
const APP_URL = 'http://localhost:8080/greeting';


const PLATFORM = process.platform;
const WIN_JAVA_PATH = 'java.exe';
const JAVA_PATH = 'java';
const INDEX_FILE = __dirname + '/dist/sprangtron-ui/index.html';
const JAR_FILE = __dirname +
  '/dist/rest-service/rest-service-0.0.1-SNAPSHOT.jar';
const WIN_PLATFORM = 'win32';

let mainWindow = null;
let JVM_PARAMS = []; //['-Dserver.port=' + port, '-Dtest=test'];

const server = new ServerProcess(PLATFORM);

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

// const getJavaPath = () => {
//   console.log('::getting java path::'); // DEBUG LOG
//   if (PLATFORM === WIN_PLATFORM) {
//     return WIN_JAVA_PATH;
//   } else {
//     return JAVA_PATH;
//   }
// };
//
// function getServerProcessJar() {
//   console.log('::getting jar-path::'); // DEBUG LOG
//   return childProcess.spawn(getJavaPath(), [
//     '-jar', JAR_FILE, {
//       cwd: app.getAppPath() + '/electron',
//     }],
//   );
// }

const handleServerProcessError = (serverProcess) => {
  serverProcess.on('error', (code, _) => {
    console.log('::error on server process:: ERR:' + code); // DEBUG LOG
    setTimeout(function() {
      app.exit();
    }, 1000);
    throw new Error('The Application could not be started');
  });
};

// function startServer() {
//   let server = server.getServerProcessJar();
//   handleServerProcessError(server);
//   console.log('::executing jar::'); // DEBUG LOG
//   server.stdout.on('data', function(data) {
//     console.log('Server: ' + data);
//   });
//
//   // server.stdout.on('data', function(data) {
//   //   console.log('Server: ' + data);
//   // });
//
//   console.log('Server PID: ' + server.pid);
//   return server;
// }

function createWindow() {
  console.log('::creating window::'); // DEBUG LOG
  let serverProcess = server.startServer(app);

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

    if (isDev) {
      mainWindow.webContents.openDevTools();
    }

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

        kill(serverProcess.pid, 'SIGTERM', function() {
          console.log('::killed java server::'); // DEBUG LOG
          serverProcess = null;
          mainWindow.close();
        });
      }
    });
  };

  const pingServer = () => {
    const requestPromise = require('minimal-request-promise');

    function onRejected() {
      return _ => {
        console.log('Waiting for the server start...');
        setTimeout(function() {
          pingServer();
        }, 200);
      };
    }

    function onFulfilled() {
      return _ => {
        console.log('Server started!');
        openWindow();
      };
    }

    requestPromise.get(APP_URL).then(onFulfilled(), onRejected());
  };
  pingServer();
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
