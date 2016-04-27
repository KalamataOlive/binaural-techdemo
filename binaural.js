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
 *
 *Requires Audiolet.js (found on https://github.com/waynehoover/HTML5-Binaural-Beat-Generator)
 */
function Binaural() {
    return {
        //constants
        BEAT_FOREVER: -2
        
        //internal variables
        ,_currentBeat: null //currently playing beat
        ,_beatSeconds: 0 //number of seconds the current beat has played
        ,_totalSeconds: 0 //total number of seconds in the chain
        ,_playing: false //is the chain currently playing?
        
        //singly linked list stuff
        ,_chain: {
            length: 0
            ,head: null
        }
        /*
         *int _positionInChain(Node)
         *Returns the position (1-based) the Node has in the chain, or -1 if it's not found
         */
        ,_positionInChain: function(node)
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
        ,_nodeAtPosition: function(position)
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
        ,_createNode: function(nodeData)
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
        ,_cloneBeat: function(beat)
        {
            //copy all known attributes, default them if they aren't set
            return {
                carrier: (typeof beat.carrier !== "number") ? 0.0 : beat.carrier
                ,frequency: (typeof beat.frequency !== "number") ? 0.0 : beat.frequency
                ,seconds: (typeof beat.seconds !== "number") ? 0 : beat.seconds
                ,fadeInSeconds: (typeof beat.fadeInSeconds !== "number") ? 0 : beat.fadeInSeconds
                ,fadeOutSeconds: (typeof beat.fadeOutSeconds !== "number") ? 0 : beat.fadeOutSeconds
                ,fadeInLow: (typeof beat.fadeInLow !== "number") ? 0 : beat.fadeInLow
                ,fadeOutLow: (typeof beat.fadeOutLow !== "number") ? 0 : beat.fadeOutLow
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
        }
        /*
         *
         */
    };
}