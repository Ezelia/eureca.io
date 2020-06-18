import { EventEmitter } from "../../EventEmitter";
import { Util } from "../../Util.class";
import { Protocol } from "../../Protocol.static";
import { Socket } from "./Socket";


var http, qs, webrtc;
if (Util.isNodejs) {
    qs = require('querystring');
    http = require('http');

    try {
        webrtc = require('wrtc');
    } catch (e) {
        //console.error("wrtc module not found : WebRTC support will not be available");
        //process.exit(e.code);
        webrtc = { unavailable: true, error: e };
    }

}

var PeerConnection = Util.isNodejs ? webrtc.RTCPeerConnection : window['RTCPeerConnection'] || window['mozRTCPeerConnection'] || window['webkitRTCPeerConnection'];
var SessionDescription = Util.isNodejs ? webrtc.RTCSessionDescription : window['RTCSessionDescription'] || window['mozRTCSessionDescription'] || window['webkitRTCSessionDescription'];


export class Peer extends EventEmitter {
    public id = Util.randomID();
    public peerConnection: RTCPeerConnection = null;
    public channel: RTCDataChannel = null;
    public tSocket: Socket;

    public pendingDataChannels = {};
    public dataChannels = {}
    //const configuration = {"iceServers":[{"url":"stun:stun.ideasip.com","urls":["stun:stun.ideasip.com"]},{"url":"stun:stun.voipstunt.com","urls":["stun:stun.voipstunt.com"]}]}
    public remainingRetries = 10;

    public peerSettings = {
        iceServers: [
            //{"url": "stun:stun.services.mozilla.com"},
            //{"urls": "stun:stun.l.google.com:19302"},
            //{"urls": "stun:stun1.l.google.com:19302"},
            //{"urls": "stun:stun2.l.google.com:19302"},
        ]
    };
    //public con = { 'optional': [{ 'DtlsSrtpKeyAgreement': true }] };




    public channelSettings = {
        reliable: true,
        ordered: true,
        maxRetransmits: null
    }
    constructor(private settings: any = { reliable: true }) {
        super();

        if (webrtc && webrtc.unavailable) {

            console.error("wrtc module not found\n");
            console.error(" * Please follow instructions here https://github.com/js-platform/node-webrtc to install wrtc\n");
            console.error(" * Note : WebRTC is only supported on x64 platforms\n");
            process.exit();
        }

        if (typeof settings.reliable != 'undefined') this.channelSettings.reliable = settings.reliable;
        if (typeof settings.maxRetransmits != 'undefined') this.channelSettings.maxRetransmits = settings.maxRetransmits;
        if (typeof settings.ordered !== 'undefined') this.channelSettings.ordered = settings.ordered;

        if (settings.iceServers instanceof Array) this.peerSettings.iceServers = settings.iceServers;
    }


    //we use HTTP for signaling
    public signal() {
        const wrtcSettings = this.settings;
        const uri = wrtcSettings.uri;

        //a timeout can occure while the datachannel is estabilishing the connection.
        //if already connected, dont restart negociation 
        if (this.lastState == 'connected' && this.channel.readyState == 'open') return;
        if (this.channel) {
            this.channel.close();
            this.lastState = 'retry';
        }


        if (this.remainingRetries <= 0) {
            this.tSocket.emit('close');
            return;
        }
        this.remainingRetries--;

        this.makeOffer().then((pc: RTCPeerConnection) => {
            if (Util.isNodejs) {
                const url = require("url");

                const postDataObj = {};
                postDataObj[Protocol.signal] = JSON.stringify(pc.localDescription);

                const post_data = qs.stringify(postDataObj);


                const parsedURI = url.parse(uri);

                const post_options = {
                    host: parsedURI.hostname,
                    port: parsedURI.port,
                    path: '/wrtc-' + wrtcSettings.prefix,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Content-Length': post_data.length
                    }
                };
                const post_req = http.request(post_options, (res) => {
                    res.setEncoding('utf8');
                    res.on('data', (chunk) => {
                        const resp = JSON.parse(chunk);

                        this.getAnswer(resp[Protocol.signal]);
                        this.remainingRetries = wrtcSettings.retries;
                    });
                });


                post_req.write(post_data);
                post_req.end();

                post_req.on('error', (error) => {
                    setTimeout(() => this.signal(), 3000);
                });
                //
            } else {

                const xhr = new XMLHttpRequest();
                const params = Protocol.signal + '=' + JSON.stringify(pc.localDescription);
                const parser = document.createElement('a');
                parser.href = uri;

                xhr.open("POST", '//' + parser.hostname + ':' + parser.port + '/wrtc-' + wrtcSettings.prefix, true);

                //Send the proper header information along with the request
                xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                //xhr.setRequestHeader("Content-length", params.length.toString());
                //xhr.setRequestHeader("Connection", "close");

                xhr.onreadystatechange = () => {//Call a function when the state changes.
                    if (xhr.readyState == 4 && xhr.status == 200) {

                        const resp = JSON.parse(xhr.responseText);

                        this.getAnswer(resp[Protocol.signal]);
                        this.remainingRetries = wrtcSettings.retries;


                    }
                    else {
                        if (xhr.readyState == 4 && xhr.status != 200) {

                            setTimeout(() => this.signal(), 3000);
                        }
                    }
                };

                xhr.send(params);
            }

            this.tSocket.update(this.channel);

        })
            .catch((error) => this.tSocket.emit('error', error));
    }


    public makeOffer() {
        return new Promise((resolve, reject) => {
            const pc = new PeerConnection(this.peerSettings);
            this.peerConnection = pc;



            //this.makeDataChannel();
            pc.onsignalingstatechange = this.onSignalingStateChange.bind(this);
            pc.oniceconnectionstatechange = this.onICEConnectionStateChange.bind(this);
            pc.onicegatheringstatechange = this.onICEGatheringStateChange.bind(this);

            pc.onicecandidate = function (candidate) {
                // Firing this callback with a null candidate indicates that
                // trickle ICE gathering has finished, and all the candidates
                // are now present in pc.localDescription.  Waiting until now
                // to create the answer saves us from having to send offer +
                // answer + iceCandidates separately.
                if (candidate.candidate == null) {
                    resolve(pc);
                }
            }

            // If you don't make a datachannel *before* making your offer (such
            // that it's included in the offer), then when you try to make one
            // afterwards it just stays in "connecting" state forever.  This is
            // my least favorite thing about the datachannel API.
            var channel = pc.createDataChannel('eureca.io',
                { /**/
                    reliable: this.channelSettings.reliable,
                    maxRetransmits: this.channelSettings.maxRetransmits,
                    ordered: this.channelSettings.ordered
                });

            this.channel = channel;

            pc.createOffer().then(desc => pc.setLocalDescription(desc), reject);
        })
    }

    public getAnswer(pastedAnswer) {
        const data = typeof pastedAnswer == 'string' ? JSON.parse(pastedAnswer) : pastedAnswer;
        const answer = new SessionDescription(data);
        this.peerConnection.setRemoteDescription(answer);
    }

    public getOffer(pastedOffer, request) {
        return new Promise((resolve, reject) => {


            const data = typeof pastedOffer === 'object' ? pastedOffer : JSON.parse(pastedOffer);


            const pc = new PeerConnection(this.peerSettings);
            this.peerConnection = pc;

            pc.onsignalingstatechange = this.onSignalingStateChange.bind(this);
            pc.oniceconnectionstatechange = this.onICEConnectionStateChange.bind(this);
            pc.onicegatheringstatechange = this.onICEGatheringStateChange.bind(this);



            pc.onicecandidate = (candidate) => {
                // null candidate indicates that
                // trickle ICE gathering has finished, and all the candidates
                // are now present in pc.localDescription.  Waiting until now
                // to create the answer saves us from having to send offer +
                // answer + iceCandidates separately.
                if (candidate.candidate == null) {
                    resolve(pc);
                }
            }





            //var labels = Object.keys(this.dataChannelSettings);
            pc.ondatachannel = (evt) => {
                const channel = evt.channel;
                channel.request = request;
                //__this.channel = channel;

                const label = channel.label;
                this.pendingDataChannels[label] = channel;
                channel.binaryType = 'arraybuffer';


                channel.onopen = () => {

                    this.dataChannels[label] = channel;
                    delete this.pendingDataChannels[label];
                    this.emit('datachannel', channel);
                };

            };

            const offer = new SessionDescription(data);
            pc.setRemoteDescription(offer)
                .then(() => pc.createAnswer(), this.doHandleError)
                .then(desc => pc.setLocalDescription(desc), this.doHandleError);
        })

    }


    public lastState = '';
    private stateTimeout;
    public onICEConnectionStateChange(state) {
        const pc = this.peerConnection;


        this.emit('stateChange', pc.iceConnectionState);
        this.lastState = pc.iceConnectionState;
        if (this.stateTimeout != undefined)
            clearTimeout(this.stateTimeout);


        if (pc.iceConnectionState == 'disconnected' || pc.iceConnectionState == 'failed') {

            this.emit('disconnected');
        }

        if (pc.iceConnectionState == 'completed' || pc.iceConnectionState == 'connected') {
            //trigger a timeout to check if client successfully connected
            this.stateTimeout = setTimeout(() => this.emit('timeout'), 500);
        }
        else {
            this.stateTimeout = setTimeout(() => this.emit('timeout'), 5000);
        }

    }

    public onICEGatheringStateChange(state) {
        //console.info('ice gathering state change:', state);
    }

    public onSignalingStateChange(state) {
        //console.log('signal state = ', state);
    }



    public doHandleError(error) {
        this.emit('error', error);
    }



}
