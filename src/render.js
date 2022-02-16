const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path');
const { Client, Authenticator } = require('minecraft-launcher-core');
const MinecraftServerListPing = require("minecraft-status").MinecraftServerListPing;
const launcher = new Client();

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'htmlRender.js'),
      contextIsolation:false,
      nodeIntegration:true
    }
  })
  win.loadFile('src/html/html.html')
}

ipcMain.on('launch_minecraft', (event, data) => {
  console.log("Launch Minecraft Called");
  let opts = {
    clientPackage: null,
    authorization:Authenticator.getAuth(data.username),
    root: app.getPath('userData')+`/`+"minecraft_dir",
    version: {
        number: data.version,
        type: data.type //default : release
    },
    memory: {
        max: data.max_ram,
        min: data.min_ram
    }
}

  launcher.launch(opts);
  
  launcher.on('debug', (e) => event.reply('logger', e));
  launcher.on('data', (e) => event.reply('logger', e));
  launcher.on('progress', (e) => event.reply('progress', e));
  launcher.on('close' , (e) => event.reply('close', e));
  //
})

app.whenReady().then(() => {
  createWindow()
})