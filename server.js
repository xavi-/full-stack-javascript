var sys = require("sys");
var url = require("url");
var qs = require("querystring");
var fs = require("fs");
var bind = require("./libraries/bind-js");
var markdown = require("./libraries/markdown-js/lib/markdown");
var srv = require("./libraries/xavlib/simple-router");
var chn = require("./libraries/xavlib/channel");

var DefaultBindHandler = (function() {
    function handler(context, req, res) {
        bind.toFile("./content/templates/default.html", context, function(data) {
            res.writeHead(200, { "Conent-Length": data.length,
                                 "Content-Type": "text/html" });
            res.end(data, "utf8");
        });
    }
    
    function bindMarkdown(callback, val) {
        callback(markdown.renderJsonML(markdown.toHTMLTree(val,"Maruku")), {}, true); 
    }

    return function(path, extContext) {
        var context = { markdown: bindMarkdown,
                        content: function(callback) { callback("(: file ~ " + path + " :)"); } };
        
        for(var i in extContext) { context[i] = extContext[i]; }
        
        return function(req, res) { handler(context, req, res); }; 
    };
})();

srv.error = DefaultBindHandler("./content/404.html");

srv.urls["/robots.txt"] = srv.staticFileHandler("./content/robots.txt", "text/plain");

srv.urls["/"] = srv.urls["/index.html"] = DefaultBindHandler("./content/index.html");

srv.urls["/subscribe"] = (function() {
    var fd = fs.openSync("./emails.txt", "a+");
    var thanksPage = DefaultBindHandler("./content/subscribe-thanks.html");
    
    return function(req, res) {
        if(req.method === "POST" || req.method === "PUT") {
            var post = "";
            req.addListener("data", function(chunk) { post += chunk; });
            req.addListener("end", function() {
                var email = qs.parse(post)["email"];
                
                fs.write(fd, email + "\n", function(err, written) {
                    sys.puts("written: " + written);
                });
            });
        }
        
        thanksPage(req, res);
    }
})();

srv.server.listen(8005);