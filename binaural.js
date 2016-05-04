/*
 *Binaural.js Binaural Beat Library
 *Tide Systems
 *April 2016
 *
 *License:
 *Use restricted unless permission specifically given by all authors listed.
 *Authors list must be retained with all substantial portions of this code.
 *Authors may be added so long as at least 25% of the code has changed for functionality or improvement purposes.
 *Unofficial (ie. edited but not by the forked version's author) versions must use a different project name yet
 *include documentation on getting to the forked version.
 *
 *Author List:
 *Luke Bullard (kalamataolive)
 */

function Binaural() {
    return {
        //constants
        BEAT_FOREVER: -2
        ,VOLUME: 0.01//maximum volume
        
        //internal variables
        //html5 audio variables
        ,"_audioContext": null
        ,"_oscillatorLeftNode": null
        ,"_oscillatorRightNode": null
        ,"_gainLeftNode": null
        ,"_gainRightNode": null
        ,"_oscillatorsStarted": false
        
        //timer ID for keeping track of beat play times
        ,"_timer": null
        
        ,"_currentBeat": null //currently playing beat
        ,"_beatsTotal": 0 //total number of beats in the chain
        ,"_beatsPlayed": 0 //number of beats played in the current chain
        
        ,"_beatSeconds": 0 //number of seconds the current beat has played
        
        ,"_secondsTotal": 0 //total number of seconds in the chain
        ,"_secondsPlayed": 0 //number of seconds the chain has played
        
        ,"_playing": false //is the chain currently playing?
        ,"_paused": false //is the chain currently paused?
        
        //singly linked list stuff
        ,"_chain": {
            length: 0
            ,head: null
        }
        /*
         *int _positionInChain(Node)
         *Returns the position (1-based) the Node has in the chain, or -1 if it's not found
         */
        ,"_positionInChain": function(node)
        {
            var currentNode = this._chain.head
                ,length = this._chain.length
                ,count = 1;
            
            //if the chain has no nodes, return error
            if (length === 0)
            {
                return -1;
            }
            
            while (currentNode != node)
            {
                //set the currentNode to the next node, and return error if there isn't a next node
                currentNode = currentNode.next;
                if (typeof currentNode === "undefined" || currentNode === null)
                {
                    return -1;
                }
                count++;
            }
            
            return count;
        }
        /*
         *Node _nodeAtPosition(int)
         *Returns the node in the chain at position, or null if no node exists at that position
         */
        ,"_nodeAtPosition": function(position)
        {
            var currentNode = this._chain.head
                ,length = this._chain.length
                ,count = 1;
            
            //error checking if position is out of bounds
            if (length === 0 || position < 1 || position > length)
            {
                //position out of bounds, return error (null)
                return null;
            }
            
            //iterate through count nodes to find the right one, then return it
            while (count < position)
            {
                currentNode = currentNode.next;
                count++;
            }
            
            return currentNode;
        }
        /*
         *Beat _createNode(Beat)
         *Returns a cloned copy of Beat nodeData and adds linked list-specific properties to it
         */
        ,"_createNode": function(nodeData)
        {
            //if nodeData is not an object, make it a blank object
            if (typeof nodeData !== 'object') {
                nodeData = {};
            }
            
            //clone it so devs can reuse their beat structures
            nodeData = this._cloneBeat(nodeData);
            
            //add linked list properties
            nodeData.next = null;
            
            return nodeData;
        }
        ,"_cloneBeat": function(beat)
        {
            //copy all known attributes, default them if they aren't set
            return {
                carrier: (typeof beat.carrier !== "number") ? 0.0 : beat.carrier
                ,frequency: (typeof beat.frequency !== "number") ? 0.0 : beat.frequency
                ,seconds: (typeof beat.seconds !== "number") ? 0 : beat.seconds
                ,fadeInSeconds: (typeof beat.fadeInSeconds !== "number") ? 0 : beat.fadeInSeconds
                ,fadeOutSeconds: (typeof beat.fadeOutSeconds !== "number") ? 0 : beat.fadeOutSeconds
                //low volume level for fading (percent, ie. 0.75 is 75%)
                ,fadeInLow: (typeof beat.fadeInLow !== "number") ? 0 : beat.fadeInLow
                ,fadeOutLow: (typeof beat.fadeOutLow !== "number") ? 0 : beat.fadeOutLow
                ,volume: (typeof beat.volume !== "number") ? 1.0 : beat.volume
            };
        }
        
        /*
         *Beat chainBeat(Beat)
         *Chains a beat at the end of the chain
         *Returns linked beat (different object from Beat argument) or null on error
         */
        ,chainBeat: function(beat)
        {
            //make sure we aren't playing
            if (this._playing)
            {
                return null;
            }
            
            beat = this._createNode(beat);
            var currentNode = this._chain.head;
            
            //list is empty
            if (!currentNode)
            {
                //set first node in the list to beat
                this._chain.head = beat;
                this._chain.length++;
                
                return beat;
            }
            
            //list is not empty
            //get last node in list
            while (currentNode.next)
            {
                currentNode = currentNode.next;
            }
            
            //add node after the current last node in the list
            currentNode.next = beat;
            this._chain.length++;
            
            return beat;
        }
        /*
         *void clearChain()
         *Clears all chained beats
         */
        ,clearChain: function()
        {
            //if the chain is playing, stop it
            if (this._playing)
            {
                this.stopChain();
            }
            
            //reset variables
            this._currentBeat = null;
            this._beatSeconds = 0;
            this._totalSeconds = 0;
            this._playing = false;
            
            //if chain is empty, return
            if (this._chain.length === 0)
            {
                return;
            }
            
            //unlink all Beat nodes
            var currentNode = this._chain.head
                ,length = this._chain.length
                ,count = 0
                ,nextNode = null;
            
            this._chain.head = null; //unlink nodes from chain
            
            while (count < length)
            {
                nextNode = currentNode.next;
                currentNode.next = null;
                currentNode = nextNode;
                count++;
            }
            
            //clear chain length property
            this._chain.length = 0;
        }
        /*
         *void unchainBeat(Beat)
         *Unlinks Beat from the chain
         */
        ,unchainBeat: function(beat)
        {
            //get beat's position in the chain
            var position = this._positionInChain(beat);
            
            //if error getting beat, return
            if (position == -1)
            {
                return;
            }
            
            //if beat is first, unlink it from the chain and make it's next the new head
            if (position == 1)
            {
                //is there a next node?
                if (typeof beat.next === "undefined" || beat.next == null)
                {
                    this._chain.head = null;
                } else {
                    this._chain.head = beat.next;
                    beat.next = null;
                }
                
                //decrement chain length property
                this._chain.length--;
                
                return;
            }
            
            var before = this._nodeAtPosition(position - 1);
            before.next = beat.next;
            beat.next = null;
        }
        /*
         *Beat chainAfter(Beat,int)
         *Add Beat to the chain right after the node at position.
         *Returns linked Beat or null on error
         */
        ,chainAfter: function(beat,position)
        {
            //make sure we aren't playing
            if (this._playing)
            {
                return null;
            }
            
            //make sure position is valid
            var beforeNode = this._nodeAtPosition(position);
            if (beforeNode == null)
            {
                return null;
            }
            
            beat = this._createNode(beat);
            
            //if there should be a node after, set it as the next for the new node
            if (typeof beforeNode.next !== "undefined" || beforeNode.next != null)
            {
                beat.next = beforeNode.next;
            }
            
            beforeNode.next = beat;
            this._chain.length++;
            
            return beat;
        }
        /*
         *Beat chainBefore(Beat,int)
         *Add Beat to the chain right before the node at position
         *Returns linked beat or null on error
         */
        ,chainBefore: function(beat,position)
        {
            //make sure we aren't playing
            if (this._playing)
            {
                return null;
            }
            
            //make sure the position is valid
            if (position <= 0 || position > this._chain.length)
            {
                return null;
            }
            
            //if adding to the first element
            if (position == 1)
            {
                beat = this._createNode(beat);
                beat.next = this._chain.head;
                this._chain.head = beat;
                this._chain.length++;
                return;
            }
            
            //if adding to an element other than the first
            return this.chainAfter(beat,position-1);
        }
        /*
         *bool chainPlaying()
         *Returns true if the chain is currently playing
         */
        ,chainPlaying: function()
        {
            return this._playing;
        }
        /*
         *bool chainPaused()
         *Returns true if audio was paused
         */
        ,chainPaused: function()
        {
            return this._paused;
        }
        /*
         *void playChain(int)
         *Plays the chain starting with the first beat in the chain or the beat at position.
         */
        ,playChain: function(position)
        {
            //if we are already playing, return
            if (this._playing)
            {
                return;
            }
            
            //if we are resuming, set volume appropriately
            if (this._paused)
            {
                this._gainLeftNode.gain.volume = this.VOLUME;
                this._gainRightNode.gain.volume = this.VOLUME;
            } else {
                //playing initially
                //if the HTML5 audio hasn't been setup, do that
                if ((typeof this._audioContext) === "undefined" || this._audioContext == null)
                {
                    this._audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    this._oscillatorLeftNode = this._audioContext.createOscillator();
                    this._oscillatorLeftNode.type = "sine";
                    this._gainLeftNode = this._audioContext.createGain();
                    this._gainLeftNode.gain.value = this.VOLUME;
                    var panLeftNode = this._audioContext.createPanner();
                    panLeftNode.setPosition(Math.sin(-90 * (Math.PI / 180)),0,0);
                    this._oscillatorLeftNode.connect(this._gainLeftNode);
                    this._gainLeftNode.connect(panLeftNode);
                    panLeftNode.connect(this._audioContext.destination);
                    
                    this._oscillatorRightNode = this._audioContext.createOscillator();
                    this._oscillatorRightNode.type = "sine";
                    this._gainRightNode = this._audioContext.createGain();
                    this._gainRightNode.gain.value = this.VOLUME;
                    var panRightNode = this._audioContext.createPanner();
                    panRightNode.setPosition(Math.sin(90 * (Math.PI / 180)),0,0);
                    this._oscillatorRightNode.connect(this._gainRightNode);
                    this._gainRightNode.connect(panRightNode);
                    panRightNode.connect(this._audioContext.destination);
                }
                
                //ensure a node exists
                if (this._chain.length <= 0)
                {
                    return;
                }
                
                //setup variables
                this._beatsTotal = this._chain.length;
                
                for (var i = 1; i <= this._beatsTotal; i++)
                {
                    var currentBeat = this._nodeAtPosition(i);
                    this._secondsTotal += currentBeat.seconds;
                }
                
                this._currentBeat = this._nodeAtPosition(1);
                this.unchainBeat(this._currentBeat);
                
                //adjust volume and start current beat
                this._oscillatorLeftNode.frequency.value = this._currentBeat.carrier;
                this._oscillatorRightNode.frequency.value = this._currentBeat.carrier + 7;
                
                //make sure to only call start() once on the oscillators
                if (!this._oscillatorsStarted)
                {
                    this._oscillatorLeftNode.start();
                    this._oscillatorRightNode.start();
                    this._oscillatorsStarted = true;
                }
                
                this._gainLeftNode.gain.value = this.VOLUME * this._currentBeat.volume * this._currentBeat.fadeInLow;
                this._gainRightNode.gain.value = this.VOLUME * this._currentBeat.volume * this._currentBeat.fadeInLow;
                
                //set timer for every second
                this._timer = setInterval(function(binauralObj){
                    //if the chain isn't playing, return
                    if (!binauralObj.chainPlaying()) {
                        return;
                    }
                    
                    //increase seconds
                    binauralObj._beatSeconds++;
                    binauralObj._totalSeconds++;
                    
                    //if the beat is over, move on
                    if (binauralObj.beatSecondsLeft() <= 0)
                    {
                        binauralObj._gainLeftNode.gain.value = 0;
                        binauralObj._gainRightNode.gain.value = 0;
                        binauralObj._beatSeconds = 0;
                        binauralObj._beatsPlayed++;
                        
                        //get next beat
                        binauralObj._currentBeat = binauralObj._nodeAtPosition(1);
                        
                        //if the next beat doesn't exist
                        if ((typeof binauralObj._currentBeat) === "undefined" || binauralObj._currentBeat == null)
                        {
                            binauralObj.stopChain();
                            return;
                        }
                        
                        binauralObj.unchainBeat(binauralObj._currentBeat);
                        
                        //adjust volume and start current beat
                        binauralObj._oscillatorLeftNode.frequency.value = binauralObj._currentBeat.carrier;
                        binauralObj._oscillatorRightNode.frequency.value = binauralObj._currentBeat.carrier + 7;
                        
                        //make sure to only call start() once on the oscillators
                        if (!binauralObj._oscillatorsStarted)
                        {
                            binauralObj._oscillatorLeftNode.start();
                            binauralObj._oscillatorRightNode.start();
                            binauralObj._oscillatorsStarted = true;
                        }
                        
                        binauralObj._gainLeftNode.gain.value = binauralObj.VOLUME * binauralObj._currentBeat.volume * binauralObj._currentBeat.fadeInLow;
                        binauralObj._gainRightNode.gain.value = binauralObj.VOLUME * binauralObj._currentBeat.volume * binauralObj._currentBeat.fadeInLow;
                    }
                    
                    //if the beat needs fading in/out, do so
                    var currentFadedVolume = binauralObj.VOLUME * binauralObj._currentBeat.volume;
                    if (binauralObj.beatSecondsPlayed() <= binauralObj._currentBeat.fadeInSeconds)
                    {
                        currentFadedVolume = binauralObj.VOLUME * binauralObj._currentBeat.volume *
                            (binauralObj._currentBeat.fadeInLow +
                            (1.0 - binauralObj._currentBeat.fadeInLow) *
                            (binauralObj.beatSecondsPlayed() / binauralObj._currentBeat.fadeInSeconds));
                    } else if (binauralObj.beatSecondsLeft() <= binauralObj._currentBeat.fadeOutSeconds &&
                        binauralObj.beatSecondsLeft() > 0)
                    {
                        currentFadedVolume = binauralObj.VOLUME * binauralObj._currentBeat.volume *
                            (1.0 - binauralObj._currentBeat.fadeOutLow) *
                            (binauralObj.beatSecondsLeft() / binauralObj._currentBeat.fadeOutSeconds);
                    }
                    binauralObj._gainLeftNode.gain.value = currentFadedVolume;
                    binauralObj._gainRightNode.gain.value = currentFadedVolume;
                    
                }, 1000, this);
            }
            this._paused = false;
            this._playing = true;
        }
        /*
         *void pauseChain()
         *Pauses the beat chain audio and time counters
         */
        ,pauseChain: function()
        {
            //set playing flag to false and mute the audio (by setting volume to 0)
            this._playing = false;
            this._gainLeftNode.gain.value = 0;
            this._gainRightNode.gain.value = 0;
            
            this._paused = true;
        }
        /*
         *void stopChain()
         *Stops the beat chain audio and clears the chain and all counters
         */
        ,stopChain: function()
        {
            //if nothing to stop, return
            if (this._paused == false && this._playing == false)
            {
                return;
            }
            
            //stop the timer
            clearInterval(this._timer);
            
            //stop the audio by setting volume to 0
            this._gainLeftNode.gain.value = 0;
            this._gainRightNode.gain.value = 0;
            
            //reset the variables
            this._paused = false;
            this._playing = false;
            this._beatSeconds = 0;
            this._beatsPlayed = 0;
            this._beatsTotal = 0;
            this._currentBeat = null;
            this._secondsPlayed = 0;
            this._secondsTotal = 0;
            
            //clear the beat chain
            this.clearChain();
        }
        /*
         *int beatsPlayed()
         *Returns the number of beats played in the current chain
         */
        ,beatsPlayed: function()
        {
            return this._beatsPlayed;
        }
        /*
         *int beatsLeft()
         *Returns the total number of beats left in the chain
         */
        ,beatsLeft: function()
        {
            return this._beatsTotal - this._beatsPlayed;
        }
        /*
         *int totalBeats()
         *Returns the total number of beats in the chain, played or not
         */
        ,totalBeats: function()
        {
            return this._beatsTotal;
        }
        /*
         *int beatSecondsPlayed()
         *Returns the number of seconds the current beat has been played
         */
        ,beatSecondsPlayed: function()
        {
            return this._beatSeconds;
        }
        /*
         *int beatSecondsLeft()
         *Returns the number of seconds left in the current beat
         */
        ,beatSecondsLeft: function()
        {
            return this._currentBeat.seconds - this._beatSeconds;
        }
        /*
         *int beatSeconds()
         *Returns the total number of seconds in the current beat
         */
        ,beatSeconds: function()
        {
            return this._currentBeat.seconds;
        }
        /*
         *int secondsPlayed()
         *Returns the number of seconds the current chain has played
         */
        ,secondsPlayed: function()
        {
            return this._secondsPlayed;
        }
        /*
         *int secondsLeft()
         *Returns the number of seconds left in the current chain
         */
        ,secondsLeft: function()
        {
            return this._secondsTotal - this._secondsPlayed;
        }
        /*
         *int totalSeconds()
         *Returns the total number of seconds in the chain, played or not
         */
        ,totalSeconds: function()
        {
            return this._secondsTotal;
        }
    };
}