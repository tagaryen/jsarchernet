function isInteger(n) {
    console.log(isNaN(n))
    console.log((n%1 === 0))
    return !isNaN(n) && (n%1 === 0);
}

/**
 * @param {Buffer} buf 
 * @param {String} seq 
 * @returns {Array<Buffer>}
*/
function bufferSplit(buf, seq) {
    let arr = [];
    let current = 0;
    let position = 0;
    while (buf.indexOf(seq, current) !== -1) {
        position = buf.indexOf(seq, current)
        let prevBuffer = buf.slice(current, position)
        arr.push(prevBuffer);
        current = position + seq.length;
    }
    arr.push(buf.slice(current));
    return arr;
}

/**
 * @param {Buffer[]} buf 
 * @param {String} seq 
 * @returns {Buffer}
*/
function bufferJoin(bufs, seq) {
    if(bufs.length < 1) {
        return null;
    }
    if(bufs.length == 1) {
        return bufs[0];
    }
    let buf = bufs[0];
    for(let i = 1; i < bufs.length; i++) {
        buf = Buffer.concat([buf, Buffer.from(seq), bufs[i]]);
    }
    return buf;
}

module.exports = {
    isInteger: isInteger,
    bufferSplit: bufferSplit,
    bufferJoin: bufferJoin
}