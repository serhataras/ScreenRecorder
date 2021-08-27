/* Imports */
const cors = require('cors');
const { MongoClient } = require('mongodb');
const mongodb = require('mongodb');
const fs = require('fs');
const app = require('express')();
const http = require('http').createServer(app);
const { Readable } = require('stream');
const assert = require('assert');
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

let videoDurationInSeconds = 30;
let batchDurationInSeconds = 1 / 2;
let batchSize = videoDurationInSeconds / batchDurationInSeconds;
let buffer = [];

socketIO.on('connection', (socket) => {
    console.log('new client connected');
    socket.on('heartbeat', (ack) => {
        socket.emit('heartbeat', ack);
        console.log('heartbeat');
    });

    socket.on('getVideo', (id) => {
        if (bucket) {
            let stream = bucket.openDownloadStreamByName(id);
            stream.read();
            const buffer = [];
            stream.on('data', (data) => {
                  buffer.push(data) ;
            }).on('end', function () {
                socket.emit('getVideoStream',buffer);
                });
        }
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
                   buffer = [videoBlob];
                } else {
                    buffer.push(videoBlob);
                }
                if (videoData.orderInBatch === 1) {
                    const stream = Readable.from(buffer);
                    let openUploadStream = bucket.openUploadStreamWithId(
                        videoData.fileName, videoData.fileName, {
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
                            buffer = []
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

