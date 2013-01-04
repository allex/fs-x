/**
 * Offers functionality similar to mkdir -p
 *
 * @module mkdirp
 * @author Allex Wang (allex.wxn@gmail.com)
 */
var fs = require('fs'),
    path = require('path'),
    osSep = path.sep,
    mkdirOrig = fs.mkdir,
    mkdirSyncOrig = fs.mkdirSync,
    noop = function() {};

function normalize(file) {
    return path.normalize(file);
}

function mkdir_p(dir, mode, callback, position) {
    var parts = normalize(dir).split(osSep);

    mode = mode || 0777 & (~process.umask());
    if (typeof mode === 'string') mode = parseInt(mode, 8);

    position = position || 0;
    if (position >= parts.length) {
        return callback();
    }

    var directory = parts.slice(0, position + 1).join(osSep) || osSep;
    fs.stat(directory, function(err) {
        if (err === null) {
            mkdir_p(dir, mode, callback, position + 1);
        } else {
            mkdirOrig(directory, mode, function (err) {
                if (err && err.code != 'EEXIST') {
                    return callback(err);
                } else {
                    mkdir_p(dir, mode, callback, position + 1);
                }
            });
        }
    });
}

function mkdirSync_p(dir, mode, position) {
    var parts = normalize(dir).split(osSep);

    mode = mode || 0777 & (~process.umask());
    if (typeof mode === 'string') mode = parseInt(mode, 8);

    position = position || 0;
    if (position >= parts.length) {
        return true;
    }

    var directory = parts.slice(0, position + 1).join(osSep) || osSep;
    try {
        fs.statSync(directory);
        mkdirSync_p(dir, mode, position + 1);
    } catch (e) {
        try {
            mkdirSyncOrig(directory, mode);
            mkdirSync_p(dir, mode, position + 1);
        } catch (e) {
            if (e.code != 'EEXIST') {
                throw e;
            }
            mkdirSync_p(dir, mode, position + 1);
        }
    }
}

/**
 * Create a new directory and any necessary subdirectories at dir with octal permission string mode.
 * If mode isn't specified, it defaults to 0777 & (~process.umask()).
 *
 * @param {String} path the path to create.
 * @param {String} mode (Optional) set the directory pomissions.
 * @param {Function} callback The callback trigged when directory created.
 *
 * see also https://github.com/bpedro/node-fs/blob/master/lib/fs.js
 */
exports.mkdir = function(path, mode, callback) {
    var dir = normalize(path), recursive = false;

    if (dir.split(osSep).length > 1) {
        recursive = true;
    }
    callback = callback || noop;

    if (!recursive) {
        mkdirOrig(path, mode, callback);
    } else {
        mkdir_p(path, mode, callback);
    }
};

/**
 * Polymorphic approach to fs.mkdirSync()
 *
 * see also https://github.com/bpedro/node-fs/blob/master/lib/fs.js
 */
exports.mkdirSync = function(path, mode) {
    var dir = normalize(path), recursive = false;
    if (dir.split(osSep).length > 1) {
        recursive = true;
    }
    if (!recursive) {
        mkdirSyncOrig(path, mode);
    } else {
        mkdirSync_p(path, mode);
    }
};

