import React, {Component} from "react";
import { socket } from './ScreenRecorderApi';

interface VideoListItemProps {
    videoUrl: ()=>string ;
}

interface VideoListItemState {
    videoUrl:string
}

class VideoListItem extends Component <VideoListItemProps, VideoListItemState> {

    constructor(props: VideoListItemProps) {
        super(props);
        this.state = {
            videoUrl: "",
        };
    }

    componentDidMount() {
        this.subscribeVideoStream();
    }

    subscribeVideoStream() : void {
        if (socket) {
            socket.on('getVideoStream', (videoStream) => {
                console.log('getVideoStream captured');
                const webm = videoStream.reduce((a, b)=> new Blob([a, b],
                    {type: "video/webm;codecs=h264"}));
                let videoUrl = URL.createObjectURL(webm);
                this.setState({videoUrl});
                console.log(videoUrl);
            });

        }
    }

    render(): JSX.Element {
        return (<>
                <video src = {this.state.videoUrl} width="200" height="200" controls />
            </>
        );
    }

}

export default VideoListItem
