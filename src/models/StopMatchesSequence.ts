import { StopMatchData } from "../services/Matcher";
import { StopMatch } from "../services/Matcher.types";
import { GTFSTripUnion } from "./GTFSData";

export class StopMatchesSequence {

    tripUnion: GTFSTripUnion
    stopMatchSequence: StopMatch[]

    constructor(tripUnion: GTFSTripUnion, matchData: StopMatchData) {
        this.tripUnion = tripUnion;

        this.stopMatchSequence = this.tripUnion.stopSequence.map(
            gtfsStop => matchData.matchByGtfsId[gtfsStop.id]
        );
    }
    
}
