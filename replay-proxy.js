const http = require('http');
const httpProxy = require('http-proxy');
const fs = require('fs');
const path = require('path');
const url  = require('url');
const Replay  = require('replay');

let data_dir = './data_dir';


//Replay.passThrough('localhost');
//Replay.passThrough('127.0.0.1');

var program = require('commander');

program
  .version('0.8.0')
  .option('-t, --target [value]', 'targeted proxy site (optional in replay mode)')
  .option('-m, --mode [bloody|cheat|record|replay]', 'Recorder/replay mode')
  .option('-s, --storage [value]', 'directory of data_dir')
  .option('-p, --port [value]', 'listening port', parseInt)
  .parse(process.argv);

if (!program.mode) {
    console.log("please precise a mode. [replay|record]")
    console.log("you can type 'replay-proxy -h' for help")
    process.exit(0)

    
}


Replay.mode = program.mode;

//override default storage if defined
if (program.storage) {
    data_dir = program.storage;
}

if (!program.port) {
    program.port = 2525
}

if (!program.target) {
    //program.target ='http://zmwd001.curia.europa.eu:7780/CuriaWsJudiciaire2/';
    //program.target ='http://cjlesbtest:8005/';
}

//Create data directory if not exist
if (!fs.existsSync(data_dir)){
    fs.mkdirSync(data_dir);
}


let proxy = httpProxy.createProxyServer();





function mkdirp(filepath) {
    var dirname = path.dirname(filepath);

    //console.log(("mkdir on "+dirname))
    if (!fs.existsSync(dirname)) {
        
        mkdirp(dirname);
    }

    try {
        fs.mkdirSync(dirname);
    }
    catch (error ) {

    }
        

    
}

function getFilenameForUrl(req) {
    urlParam = req.url
    if (!urlParam || urlParam === "." || urlParam === "/") {
        urlVar =  "ROOT";
    } else {
        urlVar = urlParam;
    }
    var parsedUrl = url.parse(urlVar)
    filepath = data_dir+"/"+parsedUrl.pathname;
    if (parsedUrl.query) {
        filepath = filepath + escape("?"+parsedUrl.query)
    }

    if (req.headers.accept.indexOf("json")!=-1) {
        filepath = filepath + "-json"
    } else if (req.headers.accept.indexOf("xml")!=-1) {
        filepath = filepath + "-xml"
    }
    return filepath
}

function log(req, res, content, suffix) {
    let { headers, method, urls } = req;
    //res.then((data) => { data = result} );
    
    
    
    //define filepath
    
    filepath = getFilenameForUrl(req);

    if (!(urlVar==="ROOT")) {
        mkdirp(filepath);
    }
    return fs.writeFileSync(filepath+"-"+suffix, content);
}

console.log(">>> LAUNCHING PROXY ON PORT "+program.port)



http.createServer(function (req, res) {
    proxy.web(req, res, {
      target: program.target
    });
}).listen(program.port);


