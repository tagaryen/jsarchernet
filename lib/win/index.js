function detect() {
    if (process.versions.napi == null || process.versions.napi < 8) {
        throw new Error(`This engine is based on Node ${process.versions.node}`);
    }
    return `${process.platform}_${process.arch}`;
}


function wrap(native) {
    let obj = {
        ...native,
    };
    obj.load = (...args) => {
        return native.load(...args);
    };
    return obj;
}

var triplet = detect();
var native = null;
try {
    switch (triplet) {
        case "win32_arm64":
        {
            native = require("./win32_arm64/koffi.node");
        }
        break;
        case "win32_ia32":
        {
            native = require("./win32_ia32/koffi.node");
        }
        break;
        case "win32_x64":
        {
            native = require("./win32_x64/koffi.node");
        }
        break;
        default:
            throw new Error("invalid paltform " + triplet2);
    }
} catch(err) {
    throw err;
}
if(native == null) {
    throw new Error("Cannot load the library");
}

module.exports = wrap(native);


