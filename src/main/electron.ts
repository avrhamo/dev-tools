import { app, BrowserWindow } from 'electron';
import * as path from 'path';

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development';
console.log('Running in:', isDev ? 'development' : 'production', 'mode');

async function createWindow(): Promise<void> {
  try {
    // Create the browser window.
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      },
      show: false // Don't show the window until it's ready
    });

    console.log('Window created');

    // Log various paths to help with debugging
    console.log('Current directory:', __dirname);
    console.log('Preload path:', path.join(__dirname, 'preload.js'));

    // Handle window ready-to-show
    mainWindow.once('ready-to-show', () => {
      console.log('Window ready to show');
      mainWindow?.show();
    });

    // Log loading errors
    mainWindow.webContents.on('did-fail-load', (_, errorCode, errorDescription) => {
      console.error('Failed to load:', { errorCode, errorDescription });
    });

    try {
      console.log('Loading development URL...');
        await mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
      // if (isDev) {
      //   console.log('Loading development URL...');
      //   await mainWindow.loadURL('http://localhost:5173');
      //   mainWindow.webContents.openDevTools();
      // } else {
      //   const indexPath = path.join(__dirname, '../dist/index.html');
      //   console.log('Loading production file:', indexPath);
      //   await mainWindow.loadFile(indexPath);
      // }
    } catch (error) {
      console.error('Error loading content:', error);
      throw error; // Re-throw to be caught by outer try-catch
    }

    // Handle window close
    mainWindow.on('closed', () => {
      console.log('Window closed');
      mainWindow = null;
    });

  } catch (error) {
    console.error('Error creating window:', error);
    throw error;
  }
}

app.whenReady().then(async () => {
  console.log('App is ready');
  try {
    await createWindow();
    console.log('Window created successfully');
  } catch (error) {
    console.error('Failed to create window:', error);
    app.quit();
  }

  app.on('activate', async () => {
    console.log('Activate event received');
    if (mainWindow === null) {
      try {
        await createWindow();
      } catch (error) {
        console.error('Failed to create window on activate:', error);
      }
    }
  });
}).catch(error => {
  console.error('Failed to initialize app:', error);
});

app.on('window-all-closed', () => {
  console.log('All windows closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle any uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

// Log when app is quitting
app.on('before-quit', () => {
  console.log('Application is quitting...');
});