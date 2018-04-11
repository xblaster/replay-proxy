# replay-proxy
a simple recorder replay proxy

    Usage: replay-proxy [options]
  
    Options:
    
     -V, --version           output the version number
     -t, --target [value]    targeted proxy site (optional in replay mode)
     -m, --mode [value]      Recorder/replay mode
     -s, --storage [value]   directory of data_dir
     -p, --port [value]      listening port (2525 by default)
     -h, --help              output usage information
     
     example:
     node replay-proxy.js -s caching_dir -p 2001  -m record -t http://my_internal_site
     
     example:
     node replay-proxy.js -s caching_dir -m replay


