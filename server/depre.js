/*
connection.once('open', () => {

    var gfs = gridfs(connection.db);

    app.get('/', (req, res) => {
        res.send('Download/Upload GridFS files to MongoDB');
    });

    // Upload a file from loca file-system to MongoDB
    app.get('/api/file/upload', (req, res) => {

		var filename = req.query.filename;

        var writestream = gfs.createWriteStream({ filename: filename });
        fs.createReadStream(__dirname + "/uploads/" + filename).pipe(writestream);
        writestream.on('close', (file) => {
            res.send('Stored File: ' + file.filename);
        });
    });

    // Download a file from MongoDB - then save to local file-system
    app.get('/api/file/download', (req, res) => {
        // Check file exist on MongoDB

		var filename = req.query.filename;

        gfs.exist({ filename: filename }, (err, file) => {
            if (err || !file) {
                res.status(404).send('File Not Found');
				return
            }

			var readstream = gfs.createReadStream({ filename: filename });
			readstream.pipe(res);
        });
    });

    // Delete a file from MongoDB
    app.get('/api/file/delete', (req, res) => {

		var filename = req.query.filename;

		gfs.exist({ filename: filename }, (err, file) => {
			if (err || !file) {
				res.status(404).send('File Not Found');
				return;
			}

			gfs.remove({ filename: filename }, (err) => {
				if (err) res.status(500).send(err);
				res.send('File Deleted');
			});
		});
    });

    // Get file information(File Meta Data) from MongoDB
	app.get('/api/file/meta', (req, res) => {

		var filename = req.query.filename;

		gfs.exist({ filename: filename }, (err, file) => {
			if (err || !file) {
				res.send('File Not Found');
				return;
			}

			gfs.files.find({ filename: filename }).toArray( (err, files) => {
				if (err) res.send(err);
				res.json(files);
			});
		});
	});

	var server = app.listen(PORT, () => {

	var host = server.address().address
	var port = server.address().port

	console.log("App listening at http://%s:%s", host, port);

	});
});

*/

const PORT = 3033;
const MONGOOSE_URI = 'mongodb://localhost:27017/';
const DB_NAME = "screen_recordings";
const MONGO_URL = MONGOOSE_URI+DB_NAME;

var app = require('express')();
var http = require('http').createServer(app);
var cors = require('cors');
var fs = require('fs');
const assert = require('assert');
var mongoose = require("mongoose");
var Grid = require('gridfs-stream');
const mongodb = require('mongodb');
var socket_io = require('socket.io')(http, {
    cors: {
        origin: '*',
    }
});

app.use(cors);
http.listen(PORT, 'localhost', () => {
    console.log(`listening on *:${PORT}`);
});

/*
	MongoDB Connection
*/

let gfs = null;


let db;
let bucket;



socket_io.on('connection', (socket) => {
    // socket object may be used to send specific messages to the new connected client
    socket.emit('connection', null);
    console.log('new client connected');

    mongodb.MongoClient.connect(MONGO_URL, function(error, client) {
        assert.ifError(error);
        db = client.db(DB_NAME);
        bucket = new mongodb.GridFSBucket(db, {
            chunkSizeBytes: 1024,
            bucketName: 'videos'
        });
    });

    socket.on('uploadFile', (blob,filename)=> {
        console.log('uploadFile : ' + filename );
        if(!bucket && !fs)return;
        // Upload a file from local file-system to MongoDB

        var writestream = gfs.createWriteStream(blob,{ filename: filename });
        fs.createReadStream(__dirname + "/uploads/" + filename).pipe(writestream);

        writestream.on('close', (file) => {
            socket.emit('uploadFile_res', ('Stored File: ' + file.filename));
        });
        /*

         fs.createReadStream(blob).
         pipe(bucket.openUploadStream(filename)).
         on('error', function(error) {
             assert.ifError(error);
         }).
         on('finish', function() {
             console.log('done!');
             socket.emit('uploadFile_res', ('Stored File: ' + file.filename));
             process.exit(0);
         });
         */
    });

    socket.on('removeFile', (blob,filename) => {
        console.log('removeFile');
        gfs.exist({ filename: filename }, (err, file) => {
            if (err || !file) {
                socket.emit('error',404);
                return;
            }
            gfs.remove({ filename: filename }, (err) => {
                if (err) io.emit('error',500);
                socket.emit('removeFile_res', filename + ' File Deleted');
            });
        });
    });

    socket.on('downloadFile', (blob,filename) => {
        console.log('downloadFile');
        gfs.exist({ filename: filename }, (err, file) => {
            if (err || !file) {
                socket.emit('error',404);
                return
            }
            var readstream = gfs.createReadStream({ filename: filename })

            let fileChunks = [];
            readstream.on('data', function (chunk) {
                fileChunks.push(chunk);
            });
            readstream.on('end', function () {
                let blobArr = Buffer.concat(fileChunks);
                var blob = new Blob([blobArr], {type: "octet/stream"})
                socket.emit('downloadFile_res', {blob, filename});
            });

            readstream.on('error', e => {
                socket.emit('error', e);
            });
        });
    });

    socket.on('getMETA', (blob,filename) => {
        console.log('getMETA');
        gfs.exist({ filename: filename }, (err, file) => {
            if (err || !file) {
                socket.emit('error',404);
                return;
            }
            gfs.files.find({ filename: filename }).toArray( (err, files) => {
                if (err) socket.emit('error', err);
                socket.emit('getMETA_res', files);
            });
        });
    });
});

