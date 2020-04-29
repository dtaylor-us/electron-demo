const {app, BrowserWindow} = require('electron');
const path = require('path');
const url = require('url');
const childProcess = require('child_process');
const ServerProcess = require('./ServerProcess');

const INDEX_FILE = __dirname + '/dist/sprangtron-ui/index.html';

let mainWindow = null;

const server = new ServerProcess();

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  // Create myWindow, load the rest of the app, etc...
  app.on('ready', () => {
    createWindow();
  });
}

function createWindow() {

  console.log('::creating window::'); // DEBUG LOG
  const openWindow = () => {
    console.log('::opening window::'); // DEBUG LOG
    mainWindow = new BrowserWindow({
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

    mainWindow.webContents.openDevTools();

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

  server.startServer(openWindow);

}

// app.on('ready', createWindow);

app.on('before-quit', _ => {
  console.log('::quitting::'); // DEBUG LOG
  server.kill();
  // if (serverProcess) {
  //   // kill Java executable
  //   serverProcess.kill('SIGINT');
  // }
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
