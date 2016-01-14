var fs = require('fs')
  , p = require('path')
  , noop = function() {}
  , rmdir = function(d, cb) {
      fs.rmdir(d, function(err) {
        // Error: ENOENT, no such file or directory
        cb(err && err.code !== 'ENOENT' ? err : null);
      });
    }
  , unlink = function(f, cb) {
      fs.unlink(f, function(err) {
        // Error: ENOENT, no such file or directory
        cb(err && err.code !== 'ENOENT' ? err : null);
      });
    }

/**
 * Asynchronous rm dir or file.
 *
 * @param {String} path The target dir or file path to remove.
 * @param {Function} cb (Optional) callback be call when rm successed.
 *
 * example:
 *
 * fs.rm('./foo/path', function(err) {
 *   console.log(err);
 * });
 */
exports.rm = function rm(path, cb) {
  // rm -rf
  if (!fs.existsSync(path)) return;
  if (typeof cb !== 'function') {
    cb = noop;
  }
  fs.lstat(path, function(err, stat) {
    if (!err) {
      if (stat.isDirectory()) {
        fs.readdir(path, function(err, list) {
          var c = list.length, n = c, resolved = false;
          if (c > 0) {
            while (n--) {
              rm(p.join(path, list[n]), function(err) {
                if (err) {
                  if (!resolved) {
                    resolved = true;
                    cb(err);
                  }
                  return;
                }
                if (!resolved) {
                  if (--c === 0) rmdir(path, cb);
                } else {
                  cb = c = resolved = null;
                }
              });
            }
          } else {
            rmdir(path, cb);
          }
        });
      } else {
        unlink(path, cb);
      }
    } else {
      if (err.code !== 'ENOENT') cb(err);
    }
  });
};

/**
 * Synchronous rm file or dir with sub directories.
 *
 * @overrides rmSync
 * @param {String} path The target dir to remove.
 */
exports.rmSync = function rm(dir) {
  var stat = fs.statSync(dir);
  if (stat.isDirectory()) {
    var list = fs.readdirSync(dir);
    for (var i = 0; i < list.length; i++) {
      var filename = p.join(dir, list[i]), stat = fs.statSync(filename);
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

