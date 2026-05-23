import { app, BrowserWindow } from 'electron'
import { createWindow } from './window'
import { createTray } from './tray'
import { setupDatabase } from './db'
import { setupIpcHandlers } from './ipc'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '../..')
process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : path.join(process.env.APP_ROOT, 'dist')
process.env.DIST_ELECTRON = path.join(process.env.APP_ROOT, 'dist-electron')

let mainWindow: BrowserWindow | null = null

app.whenReady().then(() => {
  setupDatabase()
  setupIpcHandlers()
  mainWindow = createWindow()
  createTray(mainWindow)
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWindow = createWindow()
  }
})
