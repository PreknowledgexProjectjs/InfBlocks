const { app, BrowserWindow, ipcMain , Menu, MenuItem } = require('electron')
const path = require('path');
const https = require('https');
const { Client, Authenticator } = require('../core/index.js');
const MinecraftServerListPing = require("minecraft-status").MinecraftServerListPing;
const launcher = new Client();
const ib_insatlls = require('data-store')({ path: app.getPath('userData') + '/ib-instlls.json' });
const msmc = require("msmc");
const fetch = require("node-fetch");
msmc.setFetch(fetch)
var PublicWin;
var pathWin = app.getPath('userData')+"/../.gloablx";
const global_X = require('data-store')({ path: pathWin + '/expirmental.json' });
var halfmoon = global_X.get('halfmoon_is_enabled');
var htmlLoad;

if (halfmoon == undefined) {
  global_X.set('halfmoon_is_enabled',false);
  htmlLoad = "html.html"
}else if (halfmoon == true) {
  htmlLoad = "newframework.html"
}else{
  htmlLoad = "html.html"
}

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'htmlRender.js'),
      contextIsolation:false,
      nodeIntegration:true
    },
    icon: path.join(__dirname, 'icon.ico')
  })
  PublicWin = win;
  var isDev = process.env.APP_DEV ? (process.env.APP_DEV.trim() == "true") : false;
    if (!isDev) {
      Menu.setApplicationMenu(null)
    }
    win.loadFile('src/html/'+htmlLoad)
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
    //
    LaunchMC(data,event);
  })

  ipcMain.on('get_versions', (event) => {
    const options = {
      hostname: 'launchermeta.mojang.com',
      port: 443,
      path: '/mc/game/version_manifest.json',
      method: 'GET'
    }

    const req = https.request(options, res => {
      console.log(`statusCode: ${res.statusCode}`)

      res.on('data', d => {
        event.reply('versions',d);
      })
    })

    req.on('error', error => {
      event.reply('versions',"NoFetch");
    })

    req.end()
  });

  ipcMain.on('launch_minecraft_id' , (event,data) => {
    var install = ib_insatlls.get(data.id);
    var opt = {
      username:data.username,
      javaPath:install.javapath,
      version:install.version,
      type:install.type,
      max_ram:install.max_ram,
      min_ram:install.min_ram,
      id:ib_insatlls.get(data.id),
      custom:install.cversion
    };
    if ( typeof data.isMsft !== 'undefined' ) {
      if (data.isMsft == true) {
        LaunchMC_Microsoft(opt,event);
      }else{
        LaunchMC(opt,event);
      }
    }else{
      LaunchMC(opt,event);
    }
  })

  function LaunchMC(data,event){
    console.log("Launch Minecraft Called");
    console.log(data);
    let opts;
    if (typeof data.custom == 'undefined') {
      console.log("Launching Normally");
       opts = {
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
    }else{
      console.log("Launching Advanced");
      opts = {
          clientPackage: null,
          authorization:Authenticator.getAuth(data.username),
          root: app.getPath('userData')+`/`+"minecraft_dir",
          javaPath: data.javaPath,
          version: {
              number: data.version,
              type: data.type, //default : release,
              custom: data.custom,
          },
          memory: {
              max: data.max_ram,
              min: data.min_ram
          }
      }
    }

      launcher.launch(opts);
      
      launcher.on('debug', (e) => event.reply('logger', e));
      launcher.on('data', (e) => hide_win_ulog(e,event));
      launcher.on('download-status', (e) => event.reply('download-status', e));
      launcher.on('progress', (e) => event.reply('progress', e));
      launcher.on('close' , (e) => unHide(e,event));
  }

  function LaunchMC_Microsoft(data,event){

    msmc.fastLaunch("raw",
    (update) => {
        //A hook for catching loading bar events and errors, standard with MSMC
        console.log("CallBack!!!!!")
        console.log(update)
    }).then(result => {
        //Let's check if we logged in?
        if (msmc.errorCheck(result)){
            console.log(result.reason)
            return;
        }
        let opts;
        if (typeof data.custom == 'undefined') {
          console.log("Launching Normally");
           opts = {
            clientPackage: null,
            authorization:msmc.getMCLC().getAuth(result),
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
        }else{
          console.log("Launching Advanced");
          opts = {
              clientPackage: null,
              authorization:msmc.getMCLC().getAuth(result),
              root: app.getPath('userData')+`/`+"minecraft_dir",
              javaPath: data.javaPath,
              version: {
                  number: data.version,
                  type: data.type, //default : release,
                  custom: data.custom,
              },
              memory: {
                  max: data.max_ram,
                  min: data.min_ram
              }
          }
        }
        //If the login works
        
        console.log("Starting!")
        launcher.launch(opts);
      
        launcher.on('debug', (e) => event.reply('logger', e));
        launcher.on('data', (e) => hide_win_ulog(e,event));
        launcher.on('download-status', (e) => event.reply('download-status', e));
        launcher.on('progress', (e) => event.reply('progress', e));
        launcher.on('close' , (e) => unHide(e,event));
    }).catch(reason => {
        //If the login fails
        launcher.on('close' , (e) => unHide("Unable to Login Intro Microsoft Account <br> Reason : "+ reason,event));
        console.log("We failed to log someone in because : " + reason);
    })
  }

  function hide_win_ulog(log,event){
    event.reply('logger', log);
    if (log.includes('OpenAL initialized')) {
      PublicWin.hide();
    }else if (log.includes('Setting User')) {
      PublicWin.hide();
    }
  }

  function unHide(log,event){
    event.reply('close', log);
    PublicWin.show();
  }

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