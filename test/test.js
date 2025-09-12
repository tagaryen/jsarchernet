
const {http, HttpError} = require('../jsarchernet')
const fs = require('fs')

// let res = http.streamRequest("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.16.9/xlsx.full.min.js", 
//     {
//         method: "GET"
//     },
//     (res, err) => {
//         console.log(res.statusCode)
//     },
//     (chunk) => {
//         fs.appendFileSync('./tmp.txt', chunk, 'utf-8');
//     }
// );
let res = http.request("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.16.9/xlsx.full.min.js", 
    {
        method: "GET"
    }
);
fs.appendFileSync('./tmp.txt', res.body, 'utf-8');


// http.createHttpServer("127.0.0.1", 9607, (req, res) => {
//     console.log(req.body.toString('utf-8'));
//     res.setBody('{"nihao":"hello"}');
//     throw new HttpError(400, "throw test");
// }, (err) => {
//     console.error(err);
// })

