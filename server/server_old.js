/* Imports */
const cors = require('cors');
const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');
const mongodb = require('mongodb');
const fs = require('fs');
const app = require('express')();
const http = require('http').createServer(app);
const { Readable } = require('stream');
const socketStream = require('@sap_oss/node-socketio-stream');
const assert = require('assert');
const { ObjectId } = require('mongodb');
const socketIO = require('socket.io')(http, {
	cors: {
		origin: '*',
	}
});
app.use(cors);

/*Constants*/
const PORT = 3033;
const MONGOOSE_URI = 'mongodb://localhost:27017/';
const DB_NAME = 'screen_recordings';
const MONGO_DB_URL = MONGOOSE_URI + DB_NAME;

const client = new MongoClient(MONGO_DB_URL, function (err, db) {
	if (err) throw err;
	console.log('Database created!');
});
client.connect().then(r => {
});

const db = client.db(DB_NAME);
const bucket = new mongodb.GridFSBucket(db, { bucketName: 'videos' });

let count = 0;
let videoDurationInSeconds = 30;
let batchDurationInSeconds = 1 / 2;
let batchSize = videoDurationInSeconds / batchDurationInSeconds;
let buffer = null;

socketIO.on('connection', (socket) => { // socket object may be used to send specific messages to the new connected client
	console.log('new client connected');

	socket.on('heartbeat', (ack) => {
		socket.emit('heartbeat', ack);
		console.log('heartbeat');
	});

	socket.on('getVideo', (id) => {

		/*
        BURASIIIIIII
        RECORDING STOP ETMEDEN ONCE GELMIYOR (STOP VIDEO DEDIGIKMDE YENIDEN CLIENT GELIYOR)
         */
		//GRID FS READ TO STREAM AND PUBLSH

		if (bucket) {
			let linkName = './'+id+'.webm';
			/*
                        let stream = bucket.openDownloadStreamByName(id);
                        stream.pipe(fs.createWriteStream(linkName));

                        stream.on('close', (e)=> {
                            socketStream(socket).emit('getVideoStream',  stream);
                            console.log('File sent: ' +  linkName);
                        })
                        //socketStream(socket).emit('getVideoStream',  stream);
            //            socket.emit('getVideoStream',  stream);
               //         console.log('File sent: ' +  linkName);
            */
			let stream = bucket.openDownloadStreamByName(id);
			/*     .pipe(fs.createWriteStream(linkName))
                 .on('error', function (error) {
                     assert.ifError(error);
                 })
                stream.on('close', function () {
                    socket.emit('getVideoStream',stream);
                     console.log('done!');
                 });*/
			stream.read();
			let buffer ;
			stream.on('data', (data) => {
				buffer = buffer + (data);
			}).on('end', function () {
				console.log('end');
				let blob =  new Buffer.from(buffer, 'base64');
				socket.emit('getVideoStream',blob);

			});
		}

		// (stream, data)
	});

	socket.emit('connection', null);

	socket.on('updateRecordingParameters', (payload) => {
		const data = JSON.parse(payload);
		videoDurationInSeconds = data.updatedVideoDurationInSeconds;
		batchDurationInSeconds = data.updatedBatchDurationInSeconds;
		batchSize = videoDurationInSeconds / batchDurationInSeconds;
		console.log('Parameters Updated -->>' + videoDurationInSeconds + ',' + batchDurationInSeconds + ',' + batchSize);
	});

	socket.on('uploadFile', (videoBlob, data) => {
		let videoData = null;
		if (data)
			videoData = JSON.parse(data);
		if (client && videoData && videoBlob) {
			client.connect(function (err) {
				if (err) throw err;
				if (!bucket && !fs) return;

				if (videoData.orderInBatch === batchSize) {
					buffer = (videoBlob);
					//buffer = new Buffer.from(videoBlob);
				} else {
					//buffer = buffer + new Buffer.from(videoBlob);
					buffer = buffer + (videoBlob);
				}
				if (videoData.orderInBatch === 1 && buffer != null) {
					const stream = Readable.from(buffer);
					let openUploadStream = bucket.openUploadStreamWithId(
						videoData.fileName, videoData.fileName, {
							//chunkSizeBytes: 1048576,
							metadata: {
								fileName: videoData.fileName,
								videoStatingDate: videoData.videoStartingDate,
								videoDuration: videoData.videoDuration
							}
						});
					stream.pipe(openUploadStream)
						.on('close', (e) => {
							socket.emit('uploadFile_res', ('Stored File: ' + openUploadStream.id));
							console.log('File Uploaded: ' +  videoData.fileName);
						});
				} else {
					console.log('batch');
					socket.emit('uploadBatch_res', ('Stored batch: ' + videoData.orderInBatch
						+ ' of :' + videoData.fileName));
				}
			});
		}
	});

	socket.on('getAllVideoMetaData', (type) => {
		if (bucket && client) {
			const cursor = bucket.find({});
			console.log('getAllVideoMetaData');
			let data = [];
			cursor.forEach(doc => {
				data.push(doc.metadata);
			}).then(r => {
				console.log("TOTAL  " + data.length);
				socket.emit('getAllVideoMetaData_result',  JSON.stringify(data))
			} );



		}
	});

	socket.on('downloadFile', (fileName) => {

		bucket.openDownloadStreamByName(fileName)
			.pipe(WritableStream('./' + fileName + '.webm'))
			.on('error', function (error) {
				assert.ifError(error);
			})
			.on('end', function () {
				console.log('done!');
				process.exit(0);
			});
	});

});

http.listen(PORT, 'localhost', () => {
	console.log(`listening on *:${PORT}`);
});

