/// <reference path="../EObject.class.ts" />
/// <reference path="../Util.class.ts" />
/// 


//highly inspired from https://github.com/cjb/serverless-webrtc/

/** @ignore */
declare var webrtc;
declare var require;


module Eureca.Transports.WebRTC {

    var webrtc;

    if (Eureca.Util.isNodejs) {
        try {
            webrtc = require('wrtc');
        } catch (e) {
            //console.error("wrtc module not found : WebRTC support will not be available");
            //process.exit(e.code);
            webrtc = {unavailable:true, error:e};
        }

    }



    var PeerConnection = Eureca.Util.isNodejs ? webrtc.RTCPeerConnection : window['RTCPeerConnection'] || window['mozRTCPeerConnection'] || window['webkitRTCPeerConnection'];
    var SessionDescription = Eureca.Util.isNodejs ? webrtc.RTCSessionDescription : window['RTCSessionDescription'] || window['mozRTCSessionDescription'] || window['webkitRTCSessionDescription'];


    export class Peer extends EObject {
        public id = Util.randomStr(16);
        public pc = null;
        private offer = null;
        //private answer = null;
        public channel = null;

        public pendingDataChannels = {};
		public dataChannels = {}

		//public dataChannelSettings = {
        //    'reliable': {
        //        ordered: true,
        //        maxRetransmits: 0
        //    },
        //};

        //public pcSettings = [
        //  {
        //    "iceServers": [{"url":"stun:stun.l.google.com:19302"}]
        //  },
        //  {
        //    "optional": [{"DtlsSrtpKeyAgreement": false}]
        //  }
        //];

        public cfg = {
            "iceServers": [
                { "url": "stun:stun.l.google.com:19302" },
                { url: 'stun:stun1.l.google.com:19302' }]
        };
        //public con = { 'optional': [{ 'DtlsSrtpKeyAgreement': true }] };
        public con;



        public channelSettings = {
            reliable: true,
            ordered: true,
            maxRetransmits:null
        }
        constructor(settings: any= {reliable:true}) {
            super();

            if (webrtc && webrtc.unavailable) {

                console.error("wrtc module not found\n");
                console.error(" * If you are running Linux or MacOS X please follow instructions here https://github.com/js-platform/node-webrtc to install wrtc\n");
                console.error(" * Windows server side WebRTC is not supported yet\n");
                process.exit();
            }

            if (typeof settings.reliable != 'undefined') this.channelSettings.reliable = settings.reliable;
            if (typeof settings.maxRetransmits != 'undefined') this.channelSettings.maxRetransmits = settings.maxRetransmits;
            if (typeof settings.ordered !== 'undefined') this.channelSettings.ordered = settings.ordered;


            //console.log('WebRTC settings = ', settings, this.channelSettings);
        }


        public makeOffer(callback) {
            var _this = this;

            var pc = new PeerConnection(this.cfg, this.con);
            this.pc = pc;

            this.makeDataChannel();
            pc.onsignalingstatechange = this.onsignalingstatechange.bind(this);
            pc.oniceconnectionstatechange = this.oniceconnectionstatechange.bind(this);
            pc.onicegatheringstatechange = this.onicegatheringstatechange.bind(this);
            pc.createOffer(function (desc) {
                pc.setLocalDescription(desc, function () { });
                // We'll pick up the offer text once trickle ICE is complete,
                // in onicecandidate.
            });
            pc.onicecandidate = function (candidate) {
                // Firing this callback with a null candidate indicates that
                // trickle ICE gathering has finished, and all the candidates
                // are now present in pc.localDescription.  Waiting until now
                // to create the answer saves us from having to send offer +
                // answer + iceCandidates separately.
                if (candidate.candidate == null) {
                    if (typeof callback == 'function') callback(pc);

                }
            }
        }

        private makeDataChannel() {
            var _this = this;
            // If you don't make a datachannel *before* making your offer (such
            // that it's included in the offer), then when you try to make one
            // afterwards it just stays in "connecting" state forever.  This is
            // my least favorite thing about the datachannel API.
            var channel = this.pc.createDataChannel(this.id, { id: _this.id, reliable: _this.channelSettings.reliable, maxRetransmits: _this.channelSettings.maxRetransmits, ordered: _this.channelSettings.ordered });
            this.channel = channel;
            channel.onopen = function () {
                _this.trigger('open', channel);
            };
            channel.onmessage = function (evt) {
                var data = JSON.parse(evt.data);
                _this.trigger('message', data.message);

                
            };
            channel.onerror = function (error) { _this.doHandleError(error) };;
        }


        public getAnswer(pastedAnswer) {
            var data = typeof pastedAnswer == 'string' ? JSON.parse(pastedAnswer) : pastedAnswer;

            var answer = new SessionDescription(data);

            this.pc.setRemoteDescription(answer);
        }






        public getOffer(pastedOffer, callback) {
            var data = JSON.parse(pastedOffer);
            this.offer = new SessionDescription(data);

            var pc = new PeerConnection(/*this.pcSettings*/this.cfg, this.con);
            this.pc = pc;

            pc.onsignalingstatechange = this.onsignalingstatechange.bind(this);
            pc.oniceconnectionstatechange = this.oniceconnectionstatechange.bind(this);
            pc.onicegatheringstatechange = this.onicegatheringstatechange.bind(this);


            


            pc.onicecandidate = function (candidate) {
                // Firing this callback with a null candidate indicates that
                // trickle ICE gathering has finished, and all the candidates
                // are now present in pc.localDescription.  Waiting until now
                // to create the answer saves us from having to send offer +
                // answer + iceCandidates separately.
                if (candidate.candidate == null) {
                    if (typeof callback == 'function') callback(pc.localDescription);
                }
            }
		  
            this.doHandleDataChannels();
        }

        public onsignalingstatechange(state) {
            //console.info('signaling state change:', state);
        }

        private lastState = '';
        private stateTimeout;
        public oniceconnectionstatechange(state) {
            
            var _this = this;
            

            if (this.pc) {
                console.info('ice connection state change:', this.pc.iceConnectionState);

                this.lastState = this.pc.iceConnectionState;
                if (this.stateTimeout != undefined)
                    clearTimeout(this.stateTimeout);

                if (this.pc.iceConnectionState == 'disconnected' || this.pc.iceConnectionState == 'failed') {
                    
                    this.trigger('disconnected');
                }

                if (this.pc.iceConnectionState == 'completed' || this.pc.iceConnectionState == 'connected') {

                    var ackObj = {};
                    ackObj[Protocol.signalACK] = 1;

                    var maxtries = 10;
                    var itv = setInterval(function () {
                        maxtries--;
                        if (maxtries <= 0) {
                            clearInterval(itv);
                            _this.doHandleError('Channel readyState failure ');
                            return;
                        }

                        if (_this.channel.readyState == 'open') {
                            clearInterval(itv);
                            _this.channel.send(JSON.stringify(ackObj));
                        }
                    }, 500);


                    //
                }
                else {
                    this.stateTimeout = setTimeout(function () {
                        console.log('State timeout');
                        _this.trigger('timeout');
                    }, 5000);
                }

            }
            //if (this.pc.
        }
        public onicegatheringstatechange(state) {
            //console.info('ice gathering state change:', state);
        }

        public doCreateAnswer() {
            var _this = this;
            this.pc.createAnswer(
                function (desc) { _this.doSetLocalDesc(desc) },
                function (error) { _this.doHandleError(error) }
                );
        }

        public doSetLocalDesc(desc) {
            var _this = this;
            //this.answer = desc;
            this.pc.setLocalDescription(desc, undefined,
                function (error) { _this.doHandleError(error) });
        }

        public doHandleError(error) {
            this.trigger('error', error);
        }
        private doHandleDataChannels() {
            var _this = this;
            //var labels = Object.keys(this.dataChannelSettings);
            this.pc.ondatachannel = function (evt) {
                var channel = evt.channel;
                _this.channel = channel;

                var label = channel.label;
                _this.pendingDataChannels[label] = channel;
                //channel.binaryType = 'arraybuffer';

                
                channel.onopen = function () {
                    _this.dataChannels[label] = channel;
                    delete _this.pendingDataChannels[label];
                };
                channel.onmessage = function (evt) {


                    var data = JSON.parse(evt.data);

                    if (data[Protocol.signalACK] == 1){                
                        _this.trigger('open', channel);
                    }

                    
                    _this.trigger('message', data.message);
                };
                channel.onerror = function (error) { _this.doHandleError(error) };
            };

            this.pc.setRemoteDescription(this.offer,
                function () { _this.doCreateAnswer() },
                function (error) { _this.doHandleError(error) });
        }


    }
}