const http = require('http');
const httpProxy = require('http-proxy');
const fs = require('fs');
const path = require('path');
const url  = require('url');

let data_dir = './data_dir';


var program = require('commander');

program
  .version('0.8.0')
  .option('-t, --target [value]', 'targeted proxy site (optional in replay mode)')
  .option('-m, --mode [value]', 'Recorder/replay mode')
  .option('-s, --storage [value]', 'directory of data_dir')
  .option('-p, --port [value]', 'listening port', parseInt)
  .parse(process.argv);

if (!program.mode) {
    console.log("please precise a mode. [replay|record]")
    console.log("you can type 'replay-proxy -h' for help")
    process.exit(0)
}

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
        console.log("[RECORD] "+req.url);
        log(req, res, body, "body");

        oldEnd.apply(res, arguments);
    };
});

proxy.on('proxyRes', function (proxyRes, req, res) {
    log(req, res, JSON.stringify(proxyRes.headers, true, 2), "headers");
});

console.log(">>> LAUNCHING PROXY ON PORT "+program.port)

if (program.mode == "replay") {
    console.log(">> LAUNCHING REPLAY MODE FOR "+program.target)
    http.createServer(function (req, res) {
        const { headers, method, url } = req;
        filepath = getFilenameForUrl(req);

        if (fs.existsSync(filepath+"-body")) {
            fs.readFile(filepath+"-body", (err, data) => {

                try {
                    var headers = JSON.parse(fs.readFileSync(filepath+"-headers"));
                    res.writeHead(200, headers);
                }
                catch (error) {
                    // nevermind... 
                }
                
                console.log("[REPLAY] "+req.url);
                res.write(data);
                res.end();
            });
        } else {
            console.log("[MISS] "+req.url);
            res.write("not recorded");
            res.end();
        }
      }).listen(program.port);
} else {
    //launch recorder proxy
    console.log(">> LAUNCHING RECORDER MODE FOR "+program.target)
    http.createServer(function (req, res) {
          proxy.web(req, res, {
            target: program.target
          });
      }).listen(program.port);
}



