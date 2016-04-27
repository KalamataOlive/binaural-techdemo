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
        
        //singly linked list stuff
        ,_chain: {
            length: 0
            ,head: null
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
         *Returns linked beat (different object from Beat argument)
         */
        ,chainBeat: function(beat)
        {
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
    };
}