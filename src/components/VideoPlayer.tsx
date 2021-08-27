import React, { Component } from 'react';
import { socket } from './ScreenRecorderApi';

interface VideoPlayerProps {
    videoUrl: string;
}

interface VideoPlayerState {
    videoUrl: string
}

class VideoPlayer extends Component <VideoPlayerProps, VideoPlayerState> {

    constructor(props: VideoPlayerProps) {
        super(props);
        this.state = {
            videoUrl: '',
        };
    }

    componentDidMount() {
        this.subscribeVideoStream();
    }

    subscribeVideoStream(): void {
        if (socket) {
            socket.on('getVideoStream', (videoStream) => {
                console.log('getVideoStream captured');
                const webm = videoStream.reduce((a, b) => new Blob([a, b],
                    { type: 'video/webm;codecs=h264' }));
                let videoUrl = URL.createObjectURL(webm);
                this.setState({ videoUrl });
                console.log(videoUrl);
            });

        }
    }

    render(): JSX.Element {
        return (<>
                <video src={this.state.videoUrl} width="400" height="400" controls/>
            </>
        );
    }

}

export default VideoPlayer;
