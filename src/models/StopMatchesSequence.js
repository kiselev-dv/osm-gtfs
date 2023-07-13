//@ts-check
import { StopsMatch } from "../services/Matcher";
import { GTFSTripUnion } from "./GTFSData";

/**
 * @typedef {import("../services/Matcher").StopMatch} StopMatch
 */

export class StopMatchesSequence {
    /** 
     * @param { GTFSTripUnion } tripUnion  
     * @param { StopsMatch } matchData 
    */
    constructor(tripUnion, matchData) {
        /**@type {GTFSTripUnion} */
        this.tripUnion = tripUnion;

        /**@type {StopMatch[]} */
        this.stopMatchSequence = this.tripUnion.stopSequence.map(
            gtfsStop => matchData.matchByGtfsId[gtfsStop.id]
        );
    }
    
}
