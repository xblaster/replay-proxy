const http = require('http');
const httpProxy = require('http-proxy');
const fs = require('fs');
const path = require('path');
const url  = require('url');

const data_dir = './data_dir';


var program = require('commander');

program
  .version('0.8.0')
  .option('-t, --target [value]', 'targeted proxy site (optional in replay mode)')
  .option('-m, --mode [value]', 'Recorder/replay mode')
  .option('-s, --storage [value]', 'directory of data_dir')
  .parse(process.argv);

if (!program.mode) {
    console.log("please precise a mode. ")
    console.log("you can type 'replay-proxy -h' for help")
    process.exit(0)
}

//override default storage if defined
if (program.storage) {
    data_dir = program.storage;
}
//Create data directory if not exist
if (!fs.existsSync(data_dir)){
    fs.mkdirSync(data_dir);
}


let proxy = httpProxy.createProxyServer();





function mkdirp(filepath) {
    var dirname = path.dirname(filepath);

    console.log(("mkdir on "+dirname))
    if (!fs.existsSync(dirname)) {
        mkdirp(dirname);
    }

    //fs.mkdirSync(filepath);
}

function getFilenameForUrl(urlParam) {
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
    return filepath
}

function log(req, res, body) {
    let { headers, method, urls } = req;
    //res.then((data) => { data = result} );
    console.log("[RECORD] req.url");
    
    

    //define filepath
    filepath = getFilenameForUrl(req.url);

    if (!(urlVar==="ROOT")) {
        mkdirp(filepath);
    }
    return fs.writeFile(filepath, body);
}


// intercept writer and store stream of result asynchonously for logging 
proxy.on('proxyReq', function (proxyRes, req, res) {
    const { headers, method, url } = req;
    var oldWrite = res.write,
          oldEnd = res.end;

    var chunks = [];

    res.write = function (chunk) {
    chunks.push(chunk);

    oldWrite.apply(res, arguments);
    };

    res.end = function (chunk) {
        if (chunk)
            chunks.push(chunk);

        var body = Buffer.concat(chunks).toString('utf8');
        //console.log(req.path, body);

        log(req, res, body);

        oldEnd.apply(res, arguments);
    };
});

console.log(program.mode)

if (program.mode == "replay") {
    console.log(">> LAUNCHING REPLAY MODE FOR "+program.target)
    http.createServer(function (req, res) {
        const { headers, method, url } = req;
        filepath = getFilenameForUrl(req.url);

        if (fs.existsSync(filepath)) {
            fs.readFile(filepath, (err, data) => {
                console.log("[REPLAY] "+req.url);
                res.write(data);
                res.end();
            });
        } else {
            console.log("[MISS] "+req.url);
            res.write("not recorded");
            res.end();
        }
      }).listen(2525);
} else {
    //launch recorder proxy
    console.log(">> LAUNCHING RECORDER MODE FOR "+program.target)
    http.createServer(function (req, res) {
          proxy.web(req, res, {
            target: 'http://zmwd001.curia.europa.eu:7780/CuriaWsJudiciaire2/'
          });
      }).listen(2525);
}



