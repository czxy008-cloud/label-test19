import { Tray, Menu, BrowserWindow, nativeImage, app } from 'electron'

let tray: Tray | null = null
let isQuitting = false

export function createTray(win: BrowserWindow): void {
  const trayIcon = nativeImage.createEmpty()

  tray = new Tray(trayIcon)
  tray.setToolTip('电子发票管理器')

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示主窗口',
      click: () => {
        if (win.isMinimized()) win.restore()
        if (!win.isVisible()) win.show()
        win.focus()
      }
    },
    {
      label: '隐藏窗口',
      click: () => {
        win.hide()
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        isQuitting = true
        app.quit()
      }
    }
  ])

  tray.setContextMenu(contextMenu)

  tray.on('double-click', () => {
    if (!win.isVisible()) {
      win.show()
    } else if (win.isMinimized()) {
      win.restore()
    } else {
      win.hide()
    }
  })

  win.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault()
      win.hide()
    }
    return false
  })
}
