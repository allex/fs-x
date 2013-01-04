/**
 * fs-x is an extension to the original nodejs fs library, offering new
 * functionalities.
 *
 * @author Allex Wang (allex.wxn@gmail.com)
 */
var fs = require('fs'),
    path = require('path'),
    crypto = require('crypto');

// directory walkers
var walker = require('./lib/walker');
fs.walk = walker.walk;
fs.find = walker.find;
fs.tree = walker.tree;

// offers functionality similar to mkdir -p
var mkdirp = require('./lib/mkdirp');
fs.md =
fs.mkdir = mkdirp.mkdir;
fs.mkdirSync = mkdirp.mkdirSync;

// remove file or directory.
var remove = require('./lib/remove');
fs.rm = remove.rm;
fs.rmSync = remove.rmSync;

// copy
var cp = require('./lib/copy');
fs.copy = cp.copy;
fs.copyFileSync = cp.copyFileSync;

// jsonfile utilities
var jsonFile = require('jsonfile');
jsonFile.spaces = 0; // disable json beatify
fs.readJSONFile = jsonFile.readFile;
fs.readJSONFileSync = jsonFile.readFileSync;
fs.writeJSONFile = jsonFile.writeFile;
fs.writeJSONFileSync = jsonFile.writeFileSync;

/**
 * Fix writeFile, writeFileSync with sub directories.
 * @overrides
 */
['writeFile', 'writeFileSync'].forEach(function(name) {
    var fsFn = fs[name];
    fs[name] = function(filename) {
        var dir = path.dirname(path.normalize(filename));
        if (dir === '.') dir = '';
        if (dir && !fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        return fsFn.apply(fs, arguments);
    };
});

// get sha1sum of a file.
fs.sha1sumSync = function(file) {
    var data = fs.readFileSync(file);
    if (data) {
        return crypto.createHash('sha1').update(data).digest('hex');
    }
    return null;
};

/**
 * Combine files to a single file.
 * @param {Array} files The file list to combine.
 * @param {String} outfile The output file path.
 */
fs.combineSync = function(files, outfile) {
    var ret = '';
    files.forEach(function(f) {
        if (fs.existsSync(f)) {
            ret += fs.readFileSync(f);
        } else {
            console.error('file "' + f + '" not exists');
        }
    });
    fs.writeFileSync(outfile, ret);
};

// make compatible for Node v0.8
if (typeof fs.exists == 'undefined')
    fs.exists = path.exists;
if (typeof fs.existsSync == 'undefined')
    fs.existsSync = path.existsSync;

// Exports
module.exports = fs;
