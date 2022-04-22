import express from 'express';
import bodyParser from "body-parser";
import cors from "cors";
import serveIndex from 'serve-index';
import serveStatic from 'serve-static';
import {resolve, normalize, sep, join, extname} from "path";

import fs from "fs";
import parseUrl from 'parseurl';
import Path from 'path';

var createError = require('http-errors');

import default_template from "../public/default.html"
import image_template from "../public/image.html"
import video_template from "../public/video.html"

var templates_types = {
    ".mp4": video_template,
    ".avi": video_template,
    ".mkv": video_template,
    ".png": image_template,
    ".jpg": image_template,
    ".bmp": image_template
}

var corsOptions = {
    origin: function (origin, callback) {
        console.log(origin)
        callback(null, true)
        /*if (whitelist.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }*/
    }
}

let port = process.env.PORT || "50000";
let storage_path = process.env.STORAGE_PATH || '/home/pierre/Documents';

const app = express()


app.use(bodyParser.json({limit: '1000mb', extended: true}))

app.get('/', function (req, res) {
    res.redirect('/explore')
})

app.use(cors(corsOptions));

app.use('/download', serveStatic(storage_path, {index: false,}));

app.use('/explore',
    serveIndex(storage_path, {'icons': true, 'view': 'details'}),
    function (req, res, next) {
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            res.statusCode = 'OPTIONS' === req.method ? 200 : 405;
            res.setHeader('Allow', 'GET, HEAD, OPTIONS');
            res.setHeader('Content-Length', '0');
            res.end();
            return;
        }

        var rootPath = normalize(resolve(storage_path) + sep);

        // parse URLs
        var url = parseUrl(req);
        var originalUrl = parseUrl.original(req);
        var dir = decodeURIComponent(url.pathname);
        var originalDir = decodeURIComponent(originalUrl.pathname);

        // join / normalize from root dir
        var path = normalize(join(rootPath, dir));

        // null byte(s), bad request
        if (~path.indexOf('\0')) return next(createError(400));

        // malicious path
        if ((path + sep).substr(0, rootPath.length) !== rootPath) {
            return next(createError(403));
        }

        // determine ".." display
        var showUp = normalize(resolve(path) + sep) !== rootPath;

        // check if we have a directory
        fs.stat(path, function (err, stat) {
            if (err && err.code === 'ENOENT') {
                return next();
            }

            if (err) {
                err.status = err.code === 'ENAMETOOLONG'
                    ? 414
                    : 500;
                return next(err);
            }

            if (stat.isDirectory()) return next();

            var ext = extname(path);
            console.log(ext)
            var template = default_template
            if (templates_types[ext]) {
                template = templates_types[ext]
            }

            // security header for content sniffing
            res.setHeader('X-Content-Type-Options', 'nosniff')

            // standard headers
            res.setHeader('Content-Type', 'text/html' + '; charset=utf-8')

            res.setHeader('Content-Length', Buffer.byteLength(template, 'utf8'))

            // body
            res.end(template, 'utf8')

        });
    }
);


app.listen(port, async () => {
    console.log('Server ready!')
    console.log('Listening on port', port)
    try {


    } catch (e) {
        console.log(e);
    }
})