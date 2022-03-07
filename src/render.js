import { app, BrowserWindow, ipcMain, Menu, MenuItem } from "electron";
import path from "path";
import https from "https";
import msmc from "msmc";
import fetch from "node-fetch";
import { Authenticator } from "../core/index.js";
import * as javaInstall from "../src/javaInstall.js";
var launcher;
import dataStore from "data-store";
import * as newCore from "../core/index.js";
import * as OldCore from "../core-old/index.js";
const ib_insatlls = dataStore({
  path: app.getPath("userData") + "/ib-instlls.json",
});
const java_installs = dataStore({
  path: app.getPath("userData") + "/je.json",
});
const ib_core = dataStore({
  path: app.getPath("userData") + "/core.json",
});

const DiscordRPC = require('discord-rpc');

//XMCL PACKAGES
import { login, offline, Authentication , lookup, GameProfile, setTexture } from "@xmcl/user";
import { launch } from "@xmcl/core";
import { getVersionList, MinecraftVersion, install } from "@xmcl/installer";

//Set Skin
const userUUID = "us9an835n";
const userAccessToken = "tokenaccess";
const userNewSkinUrl = "https://media.discordapp.net/attachments/934829686587011184/939516632240373760/player.png";
async function syncSkin() {
  await setTexture({
    accessToken: userAccessToken,
    uuid: userUUID,
    type: "skin",
    texture: {
      url: userNewSkinUrl,
      metadata: { model: "slim" }, 
      // suppose this model is a slim model
      // if this model is a normal model, this should be steve
    }
  });
}
syncSkin();
//Set Core Default
if (ib_core.get("core") == undefined) {
  launcher = new newCore.Client();
  console.log("Set Core : Core-Default");
} else if (ib_core.get("core") == "core-old") {
  //import { Client } from '../core-old/index.js';
  launcher = new OldCore.Client();
  console.log("Set Core : Core-Old");
} else if (ib_core.get("core") == "core") {
  //import { Client } from '../core/index.js';
  launcher = new newCore.Client();
  console.log("Set Core : Core-Default");
}

//MSFT ACCOUNT & GLOBALX & More
var mclc_msft = "";
msmc.setFetch(fetch);
var PublicWin;
var pathWin = app.getPath("userData") + "/../.gloablx";

const global_X = dataStore({ path: pathWin + "/expirmental.json" });
var halfmoon = global_X.get("halfmoon_is_enabled");
var htmlLoad;

var path_minecraftDir = app.getPath("userData") + `/` + "minecraft_dir";
if(ib_core.get('mc_dir') !== undefined){
  path_minecraftDir = ib_core.get('mc_dir');
}
if(ib_core.get('mc_dir') == ".minecraft"){
  path_minecraftDir = app.getPath("userData") + `/../` + ".minecraft";
}
if(ib_core.get('mc_dir') == "default"){
  path_minecraftDir = app.getPath("userData") + `/` + "minecraft_dir";
}

console.log(path_minecraftDir);

if (halfmoon == undefined) {
  global_X.set("halfmoon_is_enabled", false);
  htmlLoad = "html.html";
} else if (halfmoon == true) {
  htmlLoad = "newframework.html";
} else {
  htmlLoad = "html.html";
}
//END

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "htmlRender.js"),
      contextIsolation: false,
      nodeIntegration: true,
      webviewTag: true,
    },
    icon: path.join(__dirname, "../src/icon.ico"),
  });
  PublicWin = win;
  var isDev = process.env.APP_DEV
    ? process.env.APP_DEV.trim() == "true"
    : false;
  if (!isDev) {
    Menu.setApplicationMenu(null);
  }
  win.loadFile("src/html/" + htmlLoad);
};

//Ipc Listners
ipcMain.on("save_installation", (event, data) => {
  ib_insatlls.set("idtimestamp" + Date.now(), data);
  event.reply("success", "yes");
});
ipcMain.on("open_dev_tools", (event) => {
  PublicWin.webContents.openDevTools();
});
ipcMain.on('getJavaInstalls', (event) => {
  event.reply('javaVerGet',{
    installs:java_installs.data,
    isWin:process.platform === "win32"
  })
});
ipcMain.on("random_bar", (event) => {
  PublicWin.setProgressBar(99);
});
ipcMain.on("exit", (event) => {
  PublicWin.close();
});
ipcMain.on("ib_core", (event, data) => {
  ib_core.set("core", data);
});
ipcMain.on("install_java",(event,vdata) => {
  var minecraft = app.getPath("userData") + `/` + "minecraft_dir";
  if(ib_core.get('mc_dir') !== undefined){
    minecraft = ib_core.get('mc_dir');
  }
  if(ib_core.get('mc_dir') == ".minecraft"){
    minecraft = app.getPath("userData") + `/../` + ".minecraft";
  }
  if(ib_core.get('mc_dir') == "default"){
    minecraft = app.getPath("userData") + `/` + "minecraft_dir";
  }
  if(require('fs').existsSync(minecraft+"/java_versions")) {
    console.log("Hmm Everything ok!");
  }else{
    console.log('Hmm Everything not ok fixing whats not ok!');
    require('fs').mkdirSync(minecraft+"/java_versions", { recursive: true });
  }
  javaInstall.install({
    ver:vdata,
    path:minecraft+"/java_versions/",
  },function(data){
    console.log(data);
    if(data.state == "downloadComplete"){
      event.reply('java_istatus',{
        complete:"download",
        is_extract:"no",
        total:0,
        transferred:0,
      });
    }else if(data.state == "extracted"){
      event.reply('java_istatus',{
        complete:"extract",
        is_extract:"yes",
        total:0,
        transferred:0,
      });
      java_installs.set(`JAVA:${vdata}`,data.path);
    }else{
      event.reply('java_istatus',{
        complete:"fetch",
        is_extract:"no",
        total:data.total,
        transferred:data.transferred,
      });
    }
  });
})
ipcMain.on('set_mclocation', (event,data) => {
  ib_core.set('mc_dir',data);
  if(ib_core.get('mc_dir') !== undefined){
    path_minecraftDir = ib_core.get('mc_dir');
  }else if(ib_core.get('mc_dir') == ".minecraft"){
    path_minecraftDir = app.getPath("userData") + `/../` + ".minecraft";
  }else if(ib_core.get('mc_dir') == "default"){
    path_minecraftDir = app.getPath("userData") + `/` + "minecraft_dir";
  }
});
ipcMain.on('get_mclocation', (event,data) => {
  event.reply("mcLocation",ib_core.get("mc_dir"));
});
ipcMain.on("get_location", (event, data) => {
  event.reply("location", path.join(__dirname, "/html/render_views/"));
});
ipcMain.on("del_ins", (event, id) => {
  ib_insatlls.del(id);
  event.reply("success", "yes");
});
ipcMain.on("get_installations", (event) => {
  event.reply("ib_ins", ib_insatlls.data);
});
ipcMain.on("launch_minecraft", (event, data) => {
  //
  LaunchMC(data, event);
});
ipcMain.on("intsall_xmcl", (event, data) => {
  var minecraft = app.getPath("userData") + `/` + "minecraft_dir";
  if(ib_core.get('mc_dir') !== undefined){
    minecraft = ib_core.get('mc_dir');
  }
  if(ib_core.get('mc_dir') == ".minecraft"){
    minecraft = app.getPath("userData") + `/../` + ".minecraft";
  }
  if(ib_core.get('mc_dir') == "default"){
    minecraft = app.getPath("userData") + `/` + "minecraft_dir";
  }
  var aVersion = data;
  //async function installIt() {
    install(aVersion, minecraft);
    //console.log("Called");
  //}
  //installIt();
});
ipcMain.on("launch_minecraftXMCL", (event, data) => {
  var gamePath = app.getPath("userData") + `/` + "minecraft_dir";
  if(ib_core.get('mc_dir') !== undefined){
    gamePath = ib_core.get('mc_dir');
  }
  if(ib_core.get('mc_dir') == ".minecraft"){
    gamePath = app.getPath("userData") + `/../` + ".minecraft";
  }
  if(ib_core.get('mc_dir') == "default"){
    gamePath = app.getPath("userData") + `/` + "minecraft_dir";
  }
  const javaPath = "D:\\java-runtime-beta\\bin\\java.exe";
  const version = data.version;
  console.log(javaPath);
  console.log(version);
  console.log(gamePath);
  const proc = launch({ gamePath, javaPath , version });
  console.log(proc);
});

ipcMain.on("get_versions", (event) => {
  const options = {
    hostname: "launchermeta.mojang.com",
    port: 443,
    path: "/mc/game/version_manifest.json",
    method: "GET",
  };

  const req = https.request(options, (res) => {
    console.log(`statusCode: ${res.statusCode}`);

    res.on("data", (d) => {
      event.reply("versions", d);
    });
  });

  req.on("error", (error) => {
    event.reply("versions", "NoFetch");
  });

  req.end();
});
ipcMain.on("microsoft_login", (event) => {
  msmc
    .fastLaunch("raw", (update) => {
      //A hook for catching loading bar events and errors, standard with MSMC
      console.log("CallBack!!!!!");
      console.log(update);
    })
    .then((result) => {
      mclc_msft = msmc.getMCLC().getAuth(result);
    })
    .catch((reason) => {
      //If the login fails
      launcher.on("close", (e) =>
        unHide(
          "Unable to Login Into Microsoft Account <br> Reason : " + reason,
          event
        )
      );
      console.log("We failed to log someone in because : " + reason);
    });
});
ipcMain.on("launch_minecraft_id", (event, data) => {
  var install = ib_insatlls.get(data.id);
  var opt = {
    username: data.username,
    javaPath: install.javapath,
    version: install.version,
    type: install.type,
    max_ram: install.max_ram,
    min_ram: install.min_ram,
    id: ib_insatlls.get(data.id),
    custom: install.cversion,
  };
  if (typeof data.isMsft !== "undefined") {
    if (data.isMsft == true) {
      LaunchMC_Microsoft(opt, event);
    } else {
      LaunchMC(opt, event);
    }
  } else {
    LaunchMC(opt, event);
  }
});
//END of IPC Listenrs


function LaunchMC(data, event) {
  console.log("Launch Minecraft Called");
  console.log(data);
  setTimeout(function(){
    setActivity("Playing Minecraft "+data.version,"in InfiniteBlocks Client");
  },15e3);
  let opts;
  if (typeof data.custom == "undefined") {
    console.log("Launching Normally");
    opts = {
      clientPackage: null,
      authorization: Authenticator.getAuth(data.username),
      root: path_minecraftDir,
      javaPath: data.javaPath,
      version: {
        number: data.version,
        type: data.type, //default : release
      },
      memory: {
        max: data.max_ram,
        min: data.min_ram,
      },
    };
  } else {
    console.log("Launching Advanced");
    opts = {
      clientPackage: null,
      authorization: Authenticator.getAuth(data.username),
      root: path_minecraftDir,
      javaPath: data.javaPath,
      version: {
        number: data.version,
        type: data.type, //default : release,
        custom: data.custom,
      },
      memory: {
        max: data.max_ram,
        min: data.min_ram,
      },
    };
  }

  launcher.launch(opts);

  launcher.on("debug", (e) => event.reply("logger", e));
  launcher.on("data", (e) => hide_win_ulog(e, event));
  launcher.on("download-status", (e) => event.reply("download-status", e));
  launcher.on("progress", (e) => event.reply("progress", e));
  launcher.on("close", (e) => unHide(e, event));
}

function LaunchMC_Microsoft(data, event) {
  console.log("Microsoft Auth");
  let opts;
  if (typeof data.custom == "undefined") {
    console.log("Launching Normally");
    opts = {
      clientPackage: null,
      authorization: mclc_msft,
      root: path_minecraftDir,
      javaPath: data.javaPath,
      version: {
        number: data.version,
        type: data.type, //default : release
      },
      memory: {
        max: data.max_ram,
        min: data.min_ram,
      },
    };
  } else {
    console.log("Launching Advanced");
    opts = {
      clientPackage: null,
      authorization: mclc_msft,
      root: path_minecraftDir,
      javaPath: data.javaPath,
      version: {
        number: data.version,
        type: data.type, //default : release,
        custom: data.custom,
      },
      memory: {
        max: data.max_ram,
        min: data.min_ram,
      },
    };
  }
  //If the login works

  console.log("Starting!");
  launcher.launch(opts);

  launcher.on("debug", (e) => event.reply("logger", e));
  launcher.on("data", (e) => hide_win_ulog(e, event));
  launcher.on("download-status", (e) => event.reply("download-status", e));
  launcher.on("progress", (e) => event.reply("progress", e));
  launcher.on("close", (e) => unHide(e, event));
}

function hide_win_ulog(log, event) {
  event.reply("logger", log);
  if (log.includes("OpenAL initialized")) {
    PublicWin.hide();
  } else if (log.includes("Setting User")) {
    PublicWin.hide();
  }
}

// Set this to your Client ID.
const clientId = '950417843797770280';

// Only needed if you want to use spectate, join, or ask to join
DiscordRPC.register(clientId);

const rpc = new DiscordRPC.Client({ transport: 'ipc' });
const startTimestamp = new Date();

async function setActivity(largeImageKey = 'Creepers are very good isnt',smallImageKey = 'Evoker drops totem of undying sadly does not works for creepers') {
  if (!rpc) {
    return;
  }

  // You'll need to have snek_large and snek_small assets uploaded to
  // https://discord.com/developers/applications/<application_id>/rich-presence/assets
  rpc.setActivity({
    details: largeImageKey,
    state: smallImageKey,
    startTimestamp,
    largeImageKey: 'image1',
    largeImageText: largeImageKey,
    smallImageKey: 'image1',
    smallImageText: smallImageKey,
    instance: true,
  });
}

rpc.on('ready', () => {
  setActivity();

  // activity can only be set every 15 seconds
  //setInterval(() => {
    //setActivity();
  //}, 15e3);
});

ipcMain.on('setRpc', (event,message) => {
  setActivity(message.one,message.two);
})

rpc.login({ clientId }).catch(console.error);

function unHide(log, event) {
  event.reply("close", log);
  setTimeout(() => {
    setActivity();
  }, 15e3);
  //setActivity();
  PublicWin.show();
}

app.whenReady().then(() => {
  createWindow();
});
