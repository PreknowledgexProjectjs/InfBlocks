const JavaList = require('./javaVerList.json');
const fs = require('fs');
const request = require('request');
const Zip = require('adm-zip')
const unzipper = require('unzipper');
const progress = require('request-progress');
console.log(JavaList);
var isWin = process.platform === "win32";
module.exports.install = function (data,callback){
	var url = "";
	if (!isWin) return;
	var zipSave = "";
	if (data.ver == "java8") {
		if (isWin) {
			url = JavaList['java8']['windows'];
			zipSave = "j8win.zip";
		}else{
			url = JavaList['java8']['linux'];
			zipSave = "j8linux.tar.gz";
		}
	}else if(data.ver == "java17") {
		if (isWin) {
			url = JavaList['java17']['windows'];
			zipSave = "j17win.zip";
		}else{
			url = JavaList['java17']['linux'];
			zipSave = "j17linux.tar.gz";
		}
	}else if(data.ver == "java17lite") {
		if (isWin) {
			url = JavaList['java17lite']['windows'];
			zipSave = "j17litewin.zip";
		}else{
			url = JavaList['java17lite']['linux'];
			zipSave = "j17litelinux.tar.gz";
		}
	}

	progress(request(url), {})
	.on('progress', function (state) {
	    // The state is an object that looks like this: 
	    // { 
	    //     percent: 0.5,               // Overall percent (between 0 to 1) 
	    //     speed: 554732,              // The download speed in bytes/sec 
	    //     size: { 
	    //         total: 90044871,        // The total payload size in bytes 
	    //         transferred: 27610959   // The transferred payload size in bytes 
	    //     }, 
	    //     time: { 
	    //         elapsed: 36.235,        // The total elapsed seconds since the start (3 decimals) 
	    //         remaining: 81.403       // The remaining seconds to finish (3 decimals) 
	    //     } 
	    // } 
	    console.log('progress', state);
	    callback({
	    	error:false,
	    	error:"",
	    	state:state,
	    	total:module.exports.byte(state.size.total),
	    	transferred:module.exports.byte(state.size.transferred),
	    	percent:state.percent
	    });
	})
	.on('error', function (err) {
	    callback({
	    	error:true,
	    	error:err,
	    	state:"failure"
	    });
	})
	.on('end', function () {

	    callback({
	    	error:false,
	    	error:"",
	    	state:"downloadComplete"
	    });
	    try{
	    	new Zip(require('path').join(data.path+zipSave)).extractAllTo(data.path+zipSave+"_extract", true);
	    	getDirectories(data.path+zipSave+"_extract",function(rdata){
	  			callback({
				  	error:false,
				   	error:"",
				   	state:"extracted",
				   	path:data.path+zipSave+"_extract/"+rdata[0],
				});
	  		})
		}catch (e){
			console.log(e);
			process.exit(1);
		}
	    // require('fs').createReadStream(data.path+zipSave)
	  		// .pipe(unzipper.Extract({ path: data.path+zipSave+"_extract" }))
	  		// .on('close', () => {
	  		// 	getDirectories(data.path+zipSave+"_extract",function(rdata){
	  		// 		callback({
				 //    	error:false,
				 //    	error:"",
				 //    	state:"extracted",
				 //    	path:data.path+zipSave+"_extract/"+rdata[0],
				 //    });
	  		// 	})
	    //   	});
	})
	.pipe(fs.createWriteStream(data.path+zipSave));
}
const { readdir } = require('fs')
const getDirectories = (source, callback) =>
  readdir(source, { withFileTypes: true }, (err, files) => {
    if (err) {
      callback(err)
    } else {
      callback(
        files
          .filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name)
      )
    }
  })
module.exports.byte = function(bytes) {
    var marker = 1024; // Change to 1000 if required
    var decimal = 3; // Change as required
    var kiloBytes = marker; // One Kilobyte is 1024 bytes
    var megaBytes = marker * marker; // One MB is 1024 KB
    var gigaBytes = marker * marker * marker; // One GB is 1024 MB
    var teraBytes = marker * marker * marker * marker; // One TB is 1024 GB

    // return bytes if less than a KB
    if(bytes < kiloBytes) return bytes + " Bytes";
    // return KB if less than a MB
    else if(bytes < megaBytes) return(bytes / kiloBytes).toFixed(decimal) + " KB";
    // return MB if less than a GB
    else if(bytes < gigaBytes) return(bytes / megaBytes).toFixed(decimal) + " MB";
    // return GB if less than a TB
    else return(bytes / gigaBytes).toFixed(decimal) + " GB";
}
// module.exports.install({
// 	ver:"java17lite",
// 	path:"./test/"
// },function(data){
// 	console.log(data);
// });
