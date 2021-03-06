const { app, BrowserWindow } = require('electron');

function createWindow () {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        title: "N-Puzzle A-Star Algorithm",
        resizable: false,
        webPreferences: {
            nodeIntegration: true
        }
    })

    win.loadFile('src/index.html');
    // win.webContents.openDevTools();
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})

try {
    require('electron-reloader')(module)
} catch (_) { }
