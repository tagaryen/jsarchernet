# jsarchernet  
network framework. http(s) server and client, support openssl 1.3(gmssl)  

## install 
npm install jsarchernet  

## examples  
http client  
``` js
const {http, HttpError} = require('jsarchernet')

let res = http.request("https://www.zhihu.com", 
    {
        method: "GET",
        headers: {"User-Token": "17c858a9d7574fc78f6dc5b404a20d88"}
    });

console.log(res.statusCode)
console.log(res.body.toString('utf-8'))
```
http server
``` js
const {http, HttpError} = require('jsarchernet')

http.createHttpServer("127.0.0.1", 9607, (req, res) => {
    console.log(req.body.toString('utf-8'));
    res.setBody('{"nihao":"hello"}');
}, (err) => {
    console.error(err);
})
```