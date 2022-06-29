/* eslint global-require: off, no-console: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build:main`, this file is compiled to
 * `./src/main.prod.js` using webpack. This gives us some performance wins.
 */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import path from 'path';
import {
  app,
  BrowserWindow,
  shell,
  globalShortcut,
  ipcMain,
  screen,
  Rectangle,
} from 'electron';
import log from 'electron-log';
import MenuBuilder from './menu';
import './utils/logtransports';
import './utils/crashreport';

let mainWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (
  process.env.NODE_ENV === 'development' ||
  process.env.DEBUG_PROD === 'true'
) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    // await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 768,
    minWidth: 1024,
    minHeight: 768,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
    transparent: true,
    frame: false,
    enableLargerThanScreen: true,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#00000000',
  });

  if (process.env.NODE_ENV !== 'production')
    mainWindow.webContents.openDevTools({
      mode: 'detach',
      activate: true,
    });

  mainWindow.loadURL(`file://${__dirname}/index.html`);

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // const menuBuilder = new MenuBuilder(mainWindow);
  // menuBuilder.buildMenu();

  mainWindow.setMenu(null);

  // Open urls in the user's browser
  mainWindow.webContents.on('new-window', (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });
};

app.allowRendererProcessReuse = false;
/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  log.info('app uninitialized..............\r\n\r\n');
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.whenReady().then(createWindow).catch(console.log);
app.allowRendererProcessReuse = false;

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow();
});

app.on('ready', () => {
  globalShortcut.register('ctrl+p', () => {
    mainWindow?.webContents.openDevTools({
      mode: 'detach',
      activate: true,
    });
  });
});

let oldWindowBounds: Rectangle = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
};

ipcMain.handle('focus-mode', (evt, enable, id) => {
  log.info('app main ipc on focus-mode', enable, id);
  if (!mainWindow) return;

  if (enable) {
    oldWindowBounds = mainWindow.getBounds();

    let display: Electron.Display;

    // Find target display by display id
    // There have a known issue here, coz displayId is just index value from
    // ::EnumDisplayMonitors in windows, and is not equal the display.id from electron
    // so find specified display by id in windows will always be null
    // we can find specified display by bounds when agora-sdk support return bounds
    if (id !== undefined) {
      // eslint-disable-next-line prefer-destructuring
      display = screen.getAllDisplays().filter((item) => item.id === id)[0];
    } else {
      display = screen.getDisplayNearestPoint({
        x: oldWindowBounds.x,
        y: oldWindowBounds.y,
      });
    }

    log.info('app main ipc on focus-mode find specified display', display);

    if (!display) display = screen.getPrimaryDisplay();

    const { width, height, x, y } = display.bounds;
    mainWindow.setPosition(x, y);
    mainWindow.setSize(width, height);
  }

  if (process.platform === 'darwin') {
    if (enable) {
      app.dock.hide();
      mainWindow.setTrafficLightPosition({ x: -20, y: -20 });
    } else {
      app.dock.show();
      mainWindow.setTrafficLightPosition({ x: 0, y: 0 });
    }
    mainWindow.setFullScreenable(!enable);
    mainWindow.setVisibleOnAllWorkspaces(enable, { visibleOnFullScreen: true });
  }

  mainWindow.setHasShadow(!enable);
  mainWindow.setMovable(!enable);
  mainWindow.setResizable(!enable);
  mainWindow.setFullScreen(enable && process.platform !== 'darwin');
  BrowserWindow.fromWebContents(mainWindow.webContents)?.setIgnoreMouseEvents(
    enable,
    { forward: true }
  );
  mainWindow.setAlwaysOnTop(enable, 'screen-saver');

  if (!enable) {
    mainWindow.setBounds(oldWindowBounds);
  }
});

ipcMain.on(
  'set-ignore-mouse-events',
  (event, ...args: [ignore: boolean, opts: { forward: boolean }]) => {
    log.info('app main ipc on set-ignore-mouse-events', args);
    BrowserWindow.fromWebContents(event.sender)?.setIgnoreMouseEvents(...args);
  }
);

log.info('app initialized..............');
