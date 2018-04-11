var http = require('http'),
    httpProxy = require('http-proxy');
const fs = require('fs');
var decycle = require('json-decycle').decycle
//
// Create your proxy server and set the target in the options.
//
let proxy = httpProxy.createProxyServer();

const data_dir = './data_dir';

if (!fs.existsSync(data_dir)){
    fs.mkdirSync(data_dir);
}

function log(req, res) {
    var result = ""
    //res.then((data) => { data = result} );
    console.log(req.url);
    let url = req.url || "ROOT";
    url = encodeURIComponent(url);
    //console.log(proxyRes)
    //console.log(res)
    var toSave  = JSON.stringify( res, decycle(), 2)
    return fs.writeFile(data_dir+"/"+url, toSave);
}

proxy.on('proxyRes', function (proxyRes, req, res) {
    log(req, res);
});



/*proxy.on('data', function (proxyRes, req, res) {
    //console.log('RAW Response from the target', JSON.stringify(proxyRes.headers, true, 2));
    log(req, proxyRes);
});*/

http.createServer(function (req, res) {
    // This simulates an operation that takes 500ms to execute
      
      proxy.web(req, res, {
        target: 'http://intranet'
      });
    
  }).listen(2525);




