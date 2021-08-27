import socketClient from 'socket.io-client';
import socketStream from '@sap_oss/node-socketio-stream';

import { VideoData } from './VideoData';

export const socStream = socketStream;
export const SERVER = 'http://127.0.0.1:3033';
export const STREAM = socketStream.createStream();
export const socket = socketClient(SERVER);

export function sendVideoViaSocketIO(videoBlob, fileName, videoStartingDate
    , videoDuration, orderInBatch) {
    if (socket) {
        const data: string = JSON.stringify({
            fileName,
            orderInBatch,
            videoDuration,
            videoStartingDate
        });
        socket.emit('uploadFile', videoBlob, data);
    }
}

export function getVideo(id: string) {
    if (id) {
        if (socket) {
            console.log('getVideoSent: ' + id);
            socket.emit('getVideo', id);
        }
    }
}

export function getAllVideoMetaData() {
    if (socket) {
        console.log('getAllVideoMetaData: ');
        socket.emit('getAllVideoMetaData', 'GETALL');
    }
}

export function stopVideo(videoBlob: Blob, fileName, videoStartingDate
    , videoDuration, orderInBatch) {
    if (socket) {
        const data: string = JSON.stringify({
            fileName,
            orderInBatch,
            videoDuration,
            videoStartingDate
        });
        console.log('uploadFileStopped: ' + data);
        socket.emit('uploadFileStopped', videoBlob, data);
    }
}

