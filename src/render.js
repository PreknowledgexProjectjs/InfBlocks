const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path');
const { Client, Authenticator } = require('minecraft-launcher-core');
const MinecraftServerListPing = require("minecraft-status").MinecraftServerListPing;
const launcher = new Client();
const ib_insatlls = require('data-store')({ path: app.getPath('userData') + '/ib-instlls.json' });

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'htmlRender.js'),
      contextIsolation:false,
      nodeIntegration:true
    },
    icon: "../app_icns/icon.png"
  })
  win.loadFile('src/html/html.html')
}
ipcMain.on('save_installation', (event, data) => { 
  ib_insatlls.set('idtimestamp'+Date.now() , data);
  event.reply('success','yes')
})
ipcMain.on('del_ins', (event, id) => { 
  ib_insatlls.del(id);
  event.reply('success','yes')
})
ipcMain.on('get_installations', (event) => { 
  event.reply('ib_ins' , ib_insatlls.data );
});
ipcMain.on('launch_minecraft', (event, data) => {
  console.log("Launch Minecraft Called");
  let opts = {
    clientPackage: null,
    authorization:Authenticator.getAuth(data.username),
    root: app.getPath('userData')+`/`+"minecraft_dir",
    javaPath: data.javaPath,
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

ipcMain.on('get_java' , (event) => {
  javaversion(function(err,version){
    event.reply('javaVer' , version);
  })
});

function javaversion(callback) {
  const { exec } = require('child_process');

  exec('java -version', (err, stdout, stderr) => {
    if (err) {
     callback(null,"NoInstall");
    }

    callback(null,stdout);
    console.log(stdout);
  });
}

app.whenReady().then(() => {
  createWindow()
})