var fs = require('fs'),
    path = require('path'),
    noop = function() {};

/**
 * Asynchronous rm dir or file.
 *
 * @param {String} path The target dir or file path to remove.
 * @param {Function} cb (Optional) callback be call when rm successed.
 *
 * example:
 *
 * fs.rm('./foo/path', function(err) {
 *     sys.log(err);
 * });
 */
exports.rm = function(path, cb) {
    // rm -rf
    function rmdir(dirs, cb) {
        var dir = dirs.pop();
        if (dir) {
            fs.rmdir(dir, function(e) { rmdir(dirs, cb); });
        } else {
            cb();
        }
    }

    function unlink(file, cb) {
        fs.unlink(file, cb);
    }

    return function(path, cb) {
        if (!fs.existsSync(path)) { return; }
        if (typeof cb !== 'function') {
            cb = noop;
        }
        fs.stat(path, function(err, stat) {
            if (!err) {
                if (stat.isDirectory()) {
                    fs.walk(path, function(err, files, dirs) {
                        var c = files.length, n = c;
                        if (n) {
                            // rm files first
                            files.forEach(function(file) {
                                unlink(file, function(e) {
                                    c--;
                                    if (c === 0) { rmdir(dirs, cb); }
                                });
                            });
                        } else {
                            rmdir(dirs, cb);
                        }
                    });
                } else {
                    unlink(path, cb);
                }
            }
            else {
                if (err.code === 'ENOENT') { cb(err); }
            }
        });
    };
}();

/**
 * Synchronous rm dir with sub directories or file.
 *
 * @overrides rmSync
 * @param {String} path The target dir to remove.
 */
exports.rmSync = function rm(dir) {
    var stat = fs.statSync(dir);
    if (stat.isDirectory()) {
        var list = fs.readdirSync(dir);
        for (var i = 0; i < list.length; i++) {
            var filename = path.join(dir, list[i]), stat = fs.statSync(filename);
            if (filename == '.' || filename == '..') {
                // pass these files
            } else if (stat.isDirectory()) {
                // rmdir recursively
                rm(filename);
            } else {
                // rm fiilename
                fs.unlinkSync(filename);
            }
        }
        fs.rmdirSync(dir);
    } else {
        fs.unlinkSync(dir);
    }
};

