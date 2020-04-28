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
let serverProcess;

const server = new ServerProcess(PLATFORM);

function createWindow() {

  console.log('::creating window::'); // DEBUG LOG
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
  };

  // async function startUp() {
  //   await Promise.all([
  //     (async () => {
  //       const {result} = await server.startServer();
  //       console.log("RESULT" + result);
  //       serverProcess = result;
  //     })(),
  //     (async () => {
  //       await server.ping(openWindow);
  //     })(),
  //   ])
  // }
  //
  // startUp().then(([result]) => {
  //   openWindow();
  // }).catch((err) => {
  //   console.log(err);
  //   app.quit();
  // });

  serverProcess = server.startServer();
  server.ping(openWindow);

}

app.on('ready', createWindow);

app.on('before-quit', _ => {
  console.log('::quitting::' + serverProcess); // DEBUG LOG
  if (serverProcess) {
    // kill Java executable
    serverProcess.kill('SIGINT');
  }
});

app.on('window-all-closed', () => {
  console.log('::all windows closed::'); // DEBUG LOG
  app.quit();
  // if (PLATFORM !== 'darwin') {
  //   app.quit();
  // }
});

app.on('activate', () => {
  console.log('::activate::'); // DEBUG LOG
  if (mainWindow === null) {
    createWindow();
  }
});
