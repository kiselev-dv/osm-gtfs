//@ts-check

import KDBush from 'kdbush';
import OsmStop from '../models/OsmStop';
import GTFSData, { GTFSStop } from '../models/GTFSData';
import OSMData from './OSMData';

// Meters
const SEARCH_RADIUS = 500;

/**
 * @param { OSMData } osmData 
 */
function parseStopsFromOSMData(osmData) {
    const hwBusStop = osmData.elements
        .filter(e => e.tags && e.tags['highway'] === 'bus_stop');

    return hwBusStop.map(e => {
        return new OsmStop(null, e);
    });
}

export class StopsMatch {
    /**
     * @param {*} settings
     * @param { GTFSData } gtfsData
     * @param { OSMData } osmData 
     */
    constructor(settings, gtfsData, osmData) {
        this.settings = {
            ...settings
        };

        /** @type {StopMatch[]} */
        this.matched = [];
        
        /** @type {StopMatch[]} */
        this.unmatchedGtfs = [];

        /** @type {StopMatch[]} */
        this.unmatchedOsm = [];

        this._runMathc(gtfsData, osmData);

        /** @type {{string: StopMatch} | {}} */
        this.matchByGtfsId = {};
        [...this.matched, ...this.unmatchedGtfs].forEach(match => {
            this.matchByGtfsId[match.gtfsStop.id] = match;
        });
    }

    /**
     * @param {GTFSData} gtfsData 
     * @param {OSMData} osmData 
     */
    _runMathc(gtfsData, osmData) {

        const osmStops = parseStopsFromOSMData(osmData);

        const stopsIndex = new KDBush(osmStops.length);
        osmStops.forEach(s => {
            stopsIndex.add(s.position.x, s.position.y);
        });
        stopsIndex.finish();

        const refTag = this.settings.refTag;

        const matchedOsmStops = new Set();

        gtfsData.stops.forEach(gtfsStop => {
            const surroundOsmStops = stopsIndex
                .within(gtfsStop.position.x, gtfsStop.position.y, SEARCH_RADIUS)
                .map(i => osmStops[i]);

            const match = surroundOsmStops ? findMatch(gtfsStop, surroundOsmStops, refTag) : undefined;

            if (match) {
                this.matched.push(match);
                matchedOsmStops.add(match.osmStop);
            }
            else {
                this.unmatchedGtfs.push({
                    id: gtfsStop.id,
                    gtfsStop: gtfsStop,
                });
            }
        });

        osmStops
            .filter(s => !matchedOsmStops.has(s))
            .forEach(osmStop => this.unmatchedOsm.push({ 
                id: osmStop.getId(),
                osmStop 
            }));
        
    }

    setMatch(match, osmStop) {
        const gtfsStop = match.gtfsStop;
        const code = gtfsStop.code;

        const {platform, stopPosition} = osmStop;

        const platformMatch = checkCodeForElement(platform, this.settings.refTag, code);
        const pstopPositionMatch = checkCodeForElement(stopPosition, this.settings.refTag, code);

        if (platformMatch || pstopPositionMatch) {
            match.codeMatch = {
                platform: platformMatch,
                stopPosition: pstopPositionMatch,
            };
            match.osmStop = osmStop;   
            
            this.matched.push(match);
            this.unmatchedGtfs = this.unmatchedGtfs.filter(m => m.gtfsStop.id !== match.gtfsStop.id);

            return true;
        }

        return false;
    }
}

/**
 * @typedef {Object} StopMatch
 * @property {string} id
 * @property {OsmStop} osmStop
 * @property {GTFSStop} gtfsStop
 * @property {Object} codeMatch
 */

/**
 * @param { GTFSStop } gtfsStop
 * @param { OsmStop[] } surroundOsmStops 
 * @param { string } refTag 
 * @returns { StopMatch | undefined }
 */
function findMatch(gtfsStop, surroundOsmStops, refTag) {
    for (const osmStop of surroundOsmStops) {

        const code = gtfsStop.code;

        const platform = checkCodeForElement(osmStop.platform, refTag, code);
        const stopPosition = checkCodeForElement(osmStop.stopPosition, refTag, code);
        
        if (platform || stopPosition) {
            return {
                id: gtfsStop.id,
                osmStop,
                gtfsStop,
                codeMatch: {
                    platform,
                    stopPosition
                }
            }
        }
    }
}

function checkCodeForElement(osmElement, refTag, code) {
    if (osmElement && osmElement.tags) {
        return osmElement.tags[refTag] === code;
    }

    return false;
}
