/**
 * fs-x is an extension to the original nodejs fs library, offering new
 * functionalities.
 *
 * @author Allex Wang (allex.wxn@gmail.com)
 */
var fs = require('fs')
  , path = require('path')
  , crypto = require('crypto')
  , util = require('util')
  , walker = require('./lib/walker')
  , mkdirp = require('./lib/mkdirp')
  , remove = require('./lib/remove')
  , cp = require('./lib/copy')
  , jsonFile = require('jsonfile')

jsonFile.spaces = 0; // disable json beatify

function extend(r, s) {
  var args = [].slice.call(arguments, 1), l = args.length
  while (l--) {
    util._extend(r, args[l])
  }
  return r
}

var fsPlus = {

  // directory walkers
  walk: walker.walk,
  find: walker.find,
  tree: walker.tree,

  // offers functionality similar to mkdir -p
  mkdir: mkdirp.mkdir,
  mkdirSync: mkdirp.mkdirSync,

  // remove file or directory.
  rm: remove.rm,
  rmSync: remove.rmSync,

  /**
   * Asynchronous recursive file & directory copying
   * @method copy
   */
  copy: cp.copy,

  /**
   * Sync copy file, auto fix the dist directory exists.
   * @method copyFileSync
   */
  copyFileSync: cp.copyFileSync,

  /** JSON utilities */
  readJSONFile: jsonFile.readFile,
  readJSONFileSync: jsonFile.readFileSync,
  writeJSONFile: jsonFile.writeFile,
  writeJSONFileSync: jsonFile.writeFileSync,

  /**
   * Get sha1sum of a file.
   * @param {String} file The specified file path to calculate.
   */
  sha1sumSync: function(file) {
    var data = fs.readFileSync(file);
    if (data) {
      return crypto.createHash('sha1').update(data).digest('hex');
    }
    return null;
  },

  /**
   * Combine files to a single file.
   * @param {Array} files The file list to combine.
   * @param {String} outfile The output file path.
   */
  combineSync: function(files, outfile) {
      var ret = '';
      files.forEach(function(f) {
          if (fs.existsSync(f)) {
              ret += fs.readFileSync(f);
          } else {
              console.error('file "' + f + '" not exists');
          }
      });
      fs.writeFileSync(outfile, ret);
  }

};

/**
 * Fix writeFile, writeFileSync with sub directories.
 * @overrides
 */
['writeFile', 'writeFileSync'].forEach(function(name) {
    fsPlus[name] = function(filename) {
        var dir = path.dirname(path.normalize(filename));
        if (dir === '.') dir = '';
        if (dir && !fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        return fs[name].apply(fs, arguments);
    };
});

// alias md => mkdir
fsPlus.md = fsPlus.mkdir;

// fix native `fs` make compatible for Node v0.8
if (typeof fs.exists == 'undefined')
    fs.exists = path.exists;
if (typeof fs.existsSync == 'undefined')
    fs.existsSync = path.existsSync;

// Exports
module.exports = extend({}, fs, fsPlus);
