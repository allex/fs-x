/**
 * fs - copy extenssions.
 *
 * @author Allex Wang (allex.wxn@gmail.com)
 */
var fs = require('fs')
  , path = require('path')
  , ncp = require('ncp').ncp
  , mkdirp = require('./mkdirp');

var BUF_LENGTH = 64 * 1024;
var _buff = new Buffer(BUF_LENGTH);

var copyFileSync = function(srcFile, destFile) {
  var bytesRead, fdr, fdw, pos;
  // Ensure the dist dirname is exists
  var dir = path.dirname(destFile);
  if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
  }
  fdr = fs.openSync(srcFile, 'r');
  fdw = fs.openSync(destFile, 'w');
  bytesRead = 1;
  pos = 0;
  while (bytesRead > 0) {
    bytesRead = fs.readSync(fdr, _buff, 0, BUF_LENGTH, pos);
    fs.writeSync(fdw, _buff, 0, bytesRead);
    pos += bytesRead;
  }
  fs.closeSync(fdr);
  return fs.closeSync(fdw);
};

var copyFile = function(srcFile, destFile, cb) {
  var fdr, fdw;
  // Ensure the dist dirname is exists
  var dir = path.dirname(destFile);
  if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
  }
  fdr = fs.createReadStream(srcFile);
  fdw = fs.createWriteStream(destFile);
  if (typeof cb === 'function') {
    fdr.on('end', function() {
      return cb(null);
    });
  }
  return fdr.pipe(fdw);
};

function copy(source, dest, callback) {
    // fix ncp file parent directories as needed.
    // eg. copy foo/path/test.js => bar/path/test.js
    if (fs.existsSync(source) && fs.statSync(source).isFile()) {
        var dir = path.dirname(dest);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
    }
    if (callback)
      ncp(source, dest, callback);
    else 
      ncp(source, dest, function(){});
};

exports.copyFileSync = copyFileSync;
exports.copyFile = copyFile;
exports.copy = copy;
