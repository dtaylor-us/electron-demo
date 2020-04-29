const {app, BrowserWindow} = require('electron');
const url = require('url');
const ServerProcess = require('./ServerProcess');

const INDEX_FILE = __dirname + '/dist/sprangtron-ui/index.html';
const server = new ServerProcess();
const gotTheLock = app.requestSingleInstanceLock();

let mainWindow = null;

/// create a global var, wich will keep a reference to out loadingScreen window
let loadingScreen;
const createLoadingScreen = () => {
  /// create a browser window
  loadingScreen = new BrowserWindow(
    Object.assign({
      /// define width and height for the window
      width: 200,
      height: 400,
      /// remove the window frame, so it will become a frameless window
      frame: false,
      /// and set the transparency, to remove any window background color
      transparent: true,
    })
  );
  loadingScreen.setResizable(false);
  loadingScreen.loadURL(
    "file://" + __dirname + "/windows/loading/loading.html"
  );
  loadingScreen.on("closed", () => (loadingScreen = null));
  loadingScreen.webContents.on("did-finish-load", () => {
    loadingScreen.show();
  });
};

function createWindow() {

  console.log('::creating window::'); // DEBUG LOG
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

  /// keep listening on the did-finish-load event, when the mainWindow content has loaded
  mainWindow.webContents.on("did-finish-load", () => {
    /// then close the loading screen window and show the main window
    if (loadingScreen) {
      loadingScreen.close();
    }
    mainWindow.show();
  });

  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    console.log('::window closed::'); // DEBUG LOG
    mainWindow = null;
  });
}

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

  // This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
  app.whenReady().then(() => {
    createLoadingScreen();
    /// add a little bit of delay for tutorial purposes, remove when not needed
    server.startServer(createWindow)

  });
}

app.on('before-quit', _ => {
  console.log('::quitting::'); // DEBUG LOG
  server.kill();
});

app.on('window-all-closed', () => {
  console.log('::all windows closed::'); // DEBUG LOG
  app.quit();
});

app.on('activate', () => {
  console.log('::activate::'); // DEBUG LOG
  // if (mainWindow === null) {
  //   createWindow();
  // }
});
