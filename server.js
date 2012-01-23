var url = require("url");
var qs = require("querystring");
var fs = require("fs");
var bind = require("./libraries/bind-js");
var markdown = require("markdown").markdown;
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
        callback(markdown.toHTML(val,"Maruku"), {}, true); 
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
    var fd = fs.createWriteStream("./emails.txt", { flags: "a+" });
    var thanksPage = DefaultBindHandler("./content/subscribe-thanks.html");
    
    return function(req, res) {
        if(req.method === "POST" || req.method === "PUT") {
            var post = "";
            req.addListener("data", function(chunk) { post += chunk; });
            req.addListener("end", function() {
                var email = qs.parse(post)["email"];
                
                fd.write(email + "\n");
            });
        }
        
        thanksPage(req, res);
    }
})();

srv.server.listen(8005);
console.log("Serving on port 8005...");