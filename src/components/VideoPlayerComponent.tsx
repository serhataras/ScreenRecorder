import React, {Component} from "react";
import { VideoMetadata } from './VideoMetadata';
import { getVideo, socket } from './ScreenRecorderApi';
import VideoPlayer from './VideoPlayer';

interface VideoPlayerProps {
    //Store'a geçince orayı dinle, her yeni videoda updatelenecek.
    videoMetaData: VideoMetadata [];
}

interface VideoPlayerState {
    videoUrl:string
}

class VideoPlayerComponent extends Component <VideoPlayerProps, VideoPlayerState> {

    constructor(props: VideoPlayerProps) {
        super(props);
        this.state = {
            videoUrl: "",
        };
    }

    getVideo(id: string) {
        if (id) {
            if (socket) {
                console.log('getVideoSent: ' + id);
                socket.emit('getVideo', id);
            }
        }
    }

    render(): JSX.Element {
        return (<div className={'videoLinks'}>
            {this.props.videoMetaData.map((videoData, index) => (
                videoData && videoData.fileName &&
                <button key={videoData.fileName} onClick={(i)=>
                    this.getVideo(videoData.fileName) }> {videoData.fileName} </button>
            ))}
            <VideoPlayer videoUrl={this.state.videoUrl}/>
            </div>
        );
    }

}

export default VideoPlayerComponent
