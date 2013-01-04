var fs = require('fs'),
    path = require('path'),
    noop = function() {};

/**
 * asynchronous tree walk
 *
 * dir - root path for walk
 *
 * fileCb - callback function (file, next) called for each file
 * -- the callback must call next(falsey) to continue the iteration,
 *    or next(truthy) to abort the iteration.
 *
 * doneCb - callback function (err, files, dirs) called when iteration is finished
 * or an error occurs.
 *
 * iterator - callback function (path) called when iteration. return
 * falsey to ignore path. 
 *
 * example:
 *
 * fs.walk('./foo/path',
 *     function (file, next) { sys.log(file); next(); },
 *     function (err, files, dirs) { sys.log('done: ' + err); },
 *     function (path) { return !/\.svn|\.git/.test(path); }
 * );
 */
exports.walk = function(dir, fileCb, doneCb, iterator) {

    if (doneCb === undefined) {
        doneCb = fileCb;
        fileCb = null;
    }
    if (!fileCb) fileCb = function(f, next) { next && next(); };
    if (!doneCb) doneCb = noop;
    if (!iterator) iterator = function() { return true; };

    var files = [], dirs = [],

    collect = function(el, type) {
        (type === 'file' ? files : dirs).push(el);
    },

    // this function will recursively explore one directory in the context defined by the variables above
    dive = function(dir, fileCb, doneCb) {
        if (!iterator(dir)) {
            return;
        }
        collect(dir, 'dir');
        fs.readdir(dir, function processDir(err, list) {
            if (err || !list.length) {
                doneCb(err, files, dirs);
            }
            else {
                var p = path.join(dir, list.shift());
                if (!iterator(p)) {
                    processDir(null, list);
                    return;
                }
                fs.stat(p, function(err, stat) {
                    if (err) {
                        doneCb(err, files, dirs);
                    }
                    else {
                        var next = function(err) {
                            if (err) doneCb(err, files, dirs);
                            else processDir(null, list);
                        };
                        if (stat.isFile()) {
                            collect(p, 'file');
                            fileCb(p, next);
                        } else {
                            dive(p, fileCb, next);
                        }
                    }
                });
            }
        });
    };

    dive(path.normalize(dir), fileCb, doneCb);
};

// mapping is stat functions to options.type.	
var statIs = {
    'file': 'isFile',
    'dir': 'isDirectory',
    'link': 'isSymbolicLink',
    'socket': 'isSocket',
    'fifo': 'isFIFO',
    'blockdevice': 'isBlockDevice',
    'characterdevice': 'isCharacterDevice'
};

function True() { return true; }

/**
 * synchronous find, return object with dirs and files.
 *
 * @param {String} dir The target directory.
 * @param {Object} options The find options.
 *
 *  {RegExp}     options.ignoreRe
 *  {String}     options.extname: .js, .css, etc,.
 *  {Function}   options.filter,
 *  {String}     options.type: 'dir', 'directory', 'link'
 */
exports.find = function(dir, options) {
    options = options || {};
    var results = [],
        type = options.type,
        ignoreRe = options.ignoreRe,
        extname = options.extname,
        filter = options.filter || True;

    var findDir = function(p, results) {
        if (ignoreRe && ignoreRe.test(p)) { return; }

        var flag = filter(p), stat = fs.statSync(p), checkType = type && statIs[type];
        if (checkType) {
            flag = flag && stat[checkType]();
        }
        if (extname) {
            flag = flag && path.extname(p) === extname;
        }

        // push to results
        if (flag) {
            results.push(p);
        }

        if (stat.isDirectory()) {
            for (var array = fs.readdirSync(p), i = 0, n = array.length; i < n; i++) {
                findDir(path.join(p, array[i]), results);
            }
        }
    };

    findDir(path.normalize(dir), results);

    return results;
};

/**
 * Get directories tree list
 * @param {String} dir The target directory.
 */
exports.tree = function tree(dir, done) {
    dir = path.normalize(dir);
    var results = {
        'path': dir,
        'children': []
    };
    fs.readdir(dir, function(err, list) {
        if (err) { return done(err); }
        var pending = list.length;
        if (!pending) { return done(null, results); }
        list.forEach(function(file) {
            fs.stat(dir + '/' + file, function(err, stat) {
                if (stat && stat.isDirectory()) {
                    tree(dir + '/' + file, function(err, res) {
                        results.children.push(res);
                        if (!--pending){ done(null, results); }
                    });
                } else {
                    results.children.push({'path': dir + '/' + file});
                    if (!--pending) { done(null, results); }
                }
            });
        });
    });
};

