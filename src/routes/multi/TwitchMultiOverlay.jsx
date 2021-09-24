import React from 'react';
import BadApple from './BadApple';
import BirdUp from './BirdUp';
import RandomCustomVideo from './RandomCustomVideo';
import { w3cwebsocket as W3CWebSocket } from "websocket";
import WhatTheDub from './WhatTheDub';

let urlParams = new URLSearchParams(window.location.search);

export default class TwitchMultiOverlay extends React.Component {
    constructor(props) {
        super(props);
        this.queue = [];

        this.state = {
            currentEvent: null
        }
    }

    connect = async () => {
        const ws = new W3CWebSocket('wss://deusprogrammer.com/api/ws/twitch');

        ws.onopen = () => {
            ws.send(JSON.stringify({
                type: "REGISTER_PANEL",
                from: "PANEL",
                name: "MULTI",
                channelId: urlParams.get("channelId")
            }));

            setInterval(() => {
                ws.send(JSON.stringify({
                    type: "PING_SERVER",
                    from: "PANEL",
                    name: "MULTI",
                    channelId: urlParams.get("channelId")
                }));
            }, 20 * 1000);
        };

        ws.onmessage = async (message) => {
            let event = JSON.parse(message.data);

            if (!["BIRDUP", "RANDOM_CUSTOM_VIDEO", "BADAPPLE"].includes(event.type)) {
                return;
            }

            console.log("Received: " + JSON.stringify(event, null, 5));

            this.queue.push(event);
        };

        ws.onclose = async (e) => {
            console.log('Socket is closed. Reconnect will be attempted in 5 second.', e.reason);
            this.setState({ mobs: [] });
            setTimeout(async () => {
                this.connect();
            }, 5000);
        };

        ws.onerror = async (err) => {
            console.error('Socket encountered error: ', err.message, 'Closing socket');
            ws.close();
        };
    }

    consumer = async () => {
        if (this.queue.length <= 0 || this.state.currentEvent) {
            return;
        }

        console.log("EVENT");

        let currentEvent = this.queue[0];
        this.queue = this.queue.slice(1);
        this.playing = true;

        this.setState({currentEvent});
    }

    componentDidMount() {
        // If a channel id is supplied, connect the websocket for updates via bot commands
		if (urlParams.get("channelId")) {
			this.connect();
		}

        setInterval(this.consumer, 1000);
    }

    reset = () => {
        this.setState({currentEvent: null});
    }

    render() {
        let showComponent = null;

        console.log(JSON.stringify(this.state.currentEvent, null, 5));

        if (!this.state.currentEvent) {
            return (<div></div>)
        }

        switch(this.state.currentEvent.type) {
            case "BADAPPLE":
                showComponent = <BadApple 
                                    onComplete={this.reset}
                                    requester={this.state.currentEvent.eventData.requester} />;
                break;
            case "RANDOM_CUSTOM_VIDEO":
                showComponent = <RandomCustomVideo 
                                    onComplete={this.reset} 
                                    requester={this.state.currentEvent.eventData.requester}
                                    url={this.state.currentEvent.eventData.url} 
                                    mediaName={this.state.currentEvent.eventData.mediaName}
                                    volume={this.state.currentEvent.eventData.volume}
                                    chromaKey={this.state.currentEvent.eventData.chromaKey} />;
                break;
            case "BIRDUP":
                showComponent = <BirdUp 
                                    onComplete={this.reset}
                                    requester={this.state.currentEvent.eventData.requester} />;
                break;
            // case "DUB":
                // showComponent = (
                //     <WhatTheDub 
                //         onComplete={this.reset} 
                //         url={this.state.currentEvent.eventData.videoData.videoUrl} 
                //         subtitles={this.state.currentEvent.eventData.videoData.subtitles} 
                //         substitution={this.state.currentEvent.eventData.substitution} />
                // )
                // break;
        }

        return (
            <div>
                <div className="multContainer">
                    {showComponent}
                </div>
            </div>
        )
    }
}