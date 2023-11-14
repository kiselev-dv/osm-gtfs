//@ts-check

import KDBush from 'kdbush';
import GTFSData, { GTFSStop } from '../models/GTFSData';
import { OsmRoute } from '../models/OsmRoute';
import OsmStop from '../models/OsmStop';
import OSMData from './OSMData';

// Meters
const SEARCH_RADIUS = 500;

export const ROUTE_TYPES = [
    'public_transport', 'bus', 'tram', 
    'light_rail', 'ferry', 'trolleybus'
];

/**
 * @param { OSMData } osmData 
 */
function parseStopsFromOSMData(osmData) {
    const hwBusStop = osmData.elements.filter(e => e.tags)
        .filter(e => e.tags['highway'] === 'bus_stop' || e.tags['public_transport'] === 'platform');

    return hwBusStop.map(e => {
        try {
            return new OsmStop(null, e);
        }
        catch (err) {
            console.error('Failed to create OsmStop for', e);
            return undefined;
        }
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

        const indexEntries = osmStops.map(stop => ({
                stop,
                point: stop?.getPosition3857()
            }))
            .filter(entry => entry.point && entry.stop);


        const stopsIndex = new KDBush(indexEntries.length);
        indexEntries.forEach(({point}) => {stopsIndex.add(point.x, point.y)})

        stopsIndex.finish();

        const refTag = this.settings.refTag;

        const matchedOsmStops = new Set();

        gtfsData.stops.forEach(gtfsStop => {
            const surroundOsmStops = stopsIndex
                .within(gtfsStop.position.x, gtfsStop.position.y, SEARCH_RADIUS)
                .map(i => indexEntries[i].stop);

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

    setMatchToMatch(match, assignedMatch) {
        const osmStop = assignedMatch.osmStop;

        if (!match.gtfsStop || !osmStop) {
            return false;
        }

        if (this.setMatch(match, osmStop)) {
            this.unmatchedGtfs = this.unmatchedGtfs.filter(m => m.gtfsStop.id !== match.gtfsStop.id);
            
            const matchToRemove = this.unmatchedOsm.find(m => m.osmStop !== osmStop);
            console.log('matchToRemove', matchToRemove);

            this.unmatchedOsm = this.unmatchedOsm.filter(m => m.osmStop !== osmStop);

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
/**
 * Parse routes from osm data
 * 
 * @param { OSMData } osmData 
 * @returns { {id:number, tags:{}, type:string, members:{}[]}[] } 
 */
export function listRouteRelationsOSMData(osmData) {
    const relations = osmData.elements
        .filter(e => e.type === 'relation');

    return relations.filter(e => e.tags).filter(e => {
        return e.tags['type'] === 'route' && 
            ROUTE_TYPES.includes(e.tags['route']);
    });
}

export class RoutesMatch {
    /**
     * @param {*} settings
     * @param { GTFSData } gtfsData
     * @param { OSMData } osmData 
     * @param { StopsMatch } stopsMatch 
     */
    constructor(settings, gtfsData, osmData, stopsMatch) {
        this.settings = {
            ...settings
        };

        this.osmRoutes = [];
        
        this.matched = [];
        this.unmatchedGtfs = [];
        this.unmatchedOsm = [];
        this.noRefRelations = [];

        this._runMatch(gtfsData, osmData, stopsMatch);
    }

    _runMatch(gtfsData, osmData, stopsMatch) {
        const routeRelations = listRouteRelationsOSMData(osmData);
        const refTag = this.settings.refTag;

        const ref2Rel = new Map();

        routeRelations.forEach(rel => {
            const ref = rel.tags[refTag] || rel.tags['ref'];
            if (ref) {
                if (!ref2Rel.has(ref)) {
                    ref2Rel.set(ref, []);
                }

                ref2Rel.get(ref).push(rel);
            }
            else {
                this.noRefRelations.push(rel);
            }
        });

        const osmRouteByRef = new Map();
        for (const [ref, relations] of ref2Rel.entries()) {
            const osmRoute = new OsmRoute(ref, relations);
            osmRouteByRef.set(ref, osmRoute);
            this.osmRoutes.push(osmRoute);
        }

        Object.values(gtfsData.routes).forEach(gtfsRoute => {
            const osmRoute = osmRouteByRef.get(gtfsRoute.id);
            if (osmRoute) {
                this.matched.push({
                    osmRoute,
                    gtfsRoute,
                });
            }
            else {
                this.unmatchedGtfs.push({gtfsRoute});
            }
        });

        const matchedIds = this.matched.map(m => m.gtfsRoute.id);
        for (let [ref, osmRoute] of osmRouteByRef.entries()) {
            if (!matchedIds.includes(ref)) {
                this.unmatchedOsm.push({osmRoute});
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
