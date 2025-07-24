// /**
//  * @param {Buffer} buf 
//  * @param {String} seq 
//  * @returns {Array<Buffer>}
// */
// function bufferSplit(buf, seq) {
//     let arr = [];
//     let current = 0;
//     let position = 0;
//     while (buf.indexOf(seq, current) !== -1) {
//         position = buf.indexOf(seq, current)
//         let prevBuffer = buf.slice(current, position)
//         arr.push(prevBuffer);
//         current = position + seq.length;
//     }
//     arr.push(buf.slice(current));
//     return arr;
// }

// let a = Buffer.from("askcasckac\nasoiaoisa\nascac\n")
// let as = bufferSplit(a, '\n')
// for(let o of as) {
//     console.log(o.toString())
// }




const {http, HttpError} = require('./jsarchernet')

let res = http.request("https://www.zhihu.com", 
    {
        method: "GET",
        headers: {"User-Token": "17c858a9d7574fc78f6dc5b404a20d88"}
    });

console.log(res.statusCode)
console.log(res.body.toString('utf-8'))

// http.createHttpServer("127.0.0.1", 9607, 0, (req, res) => {
//     console.log(req.body.toString('utf-8'));
//     res.setBody('{"nihao":"hello"}');
//     throw new HttpError(400, "throw test");
// }, (err) => {
//     console.error(err);
// })