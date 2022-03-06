import { app, BrowserWindow, ipcMain, Menu, MenuItem } from "electron";
import path from "path";
import https from "https";
import msmc from "msmc";
import fetch from "node-fetch";
import { Authenticator } from "../core/index.js";
import { MinecraftServerListPing } from "minecraft-status";
var launcher;
import global_XFactory from "data-store";
import * as newCore from "../core/index";
import * as OldCore from "../core-old/index";
import ib_insatllsFactory from "data-store";
const ib_insatlls = ib_insatllsFactory({
  path: app.getPath("userData") + "/ib-instlls.json",
});
import ib_coreFactory from "data-store";
const ib_core = ib_coreFactory({
  path: app.getPath("userData") + "/core.json",
});


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

const global_X = global_XFactory({ path: pathWin + "/expirmental.json" });
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
ipcMain.on("random_bar", (event) => {
  PublicWin.setProgressBar(99);
});
ipcMain.on("exit", (event) => {
  PublicWin.close();
});
ipcMain.on("ib_core", (event, data) => {
  ib_core.set("core", data);
});
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
      authorization: msmc.getMCLC().getAuth(result),
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

function unHide(log, event) {
  event.reply("close", log);
  PublicWin.show();
}

app.whenReady().then(() => {
  createWindow();
});
