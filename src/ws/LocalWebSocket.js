import AbstractWebSocket from './AbstractWebSocket';
import { w3cwebsocket as W3CWebSocket } from "websocket";

export default class LocalWebSocket extends AbstractWebSocket {
    constructor(wsAddress, panelName, listenFor, channelId) {
        super(wsAddress, panelName, listenFor, channelId);
    }

    connect = () => {
        this.ws = new W3CWebSocket(this.wsAddress);
        this.ws.onopen = () => {
            this.ws.send(JSON.stringify({
                type: "PANEL_INIT",
                from: "PANEL",
                name: this.panelName
            }));

            if (this.interval) {
                clearInterval(this.interval);
            }

            this.interval = setInterval(() => {
                this.ws.send(JSON.stringify({
                    type: "PANEL_PING",
                    from: "PANEL",
                    name: this.panelName
                }));
            }, 20 * 1000);
        };
    
        this.ws.onmessage = (message) => {
            let event = JSON.parse(message.data);
    
            if (!this.listenFor.includes(event.type)) {
                return;
            }
    
            console.log("Received: " + JSON.stringify(event, null, 5));
    
            this.queue.push(event);
        };
    
        this.ws.onclose = (e) => {
            console.log('Socket is closed. Reconnect will be attempted in 5 second.', e.reason);
            clearInterval(this.interval);
            setTimeout(() => {
                this.connect();
            }, 5000);
        };
    
        this.ws.onerror = (err) => {
            console.error('Socket encountered error: ', err.message, 'Closing socket');
            this.ws.close();
        };
    }
}