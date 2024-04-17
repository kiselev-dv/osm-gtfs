import { StopMatchData } from "../services/Matcher";
import { OSMRelation } from "../services/OSMData.types";
import { GTFSRoute, GTFSTripUnion } from "./GTFSData";
import { OsmRoute } from "./OsmRoute";

export type RouteOrTrip = GTFSRoute | GTFSTripUnion | OsmRoute | OSMRelation;

export type ListFiltersType = {
    showMatched: boolean
    showUnmatchedGtfs: boolean
    showUnmatchedOsm: boolean
    filterBy: RouteOrTrip[]
};

export const defaultFilters = {
    showMatched: true,
    showUnmatchedGtfs: true,
    showUnmatchedOsm: true,
    filterBy: []
};

export function filterMatches(matchData: StopMatchData, filters: ListFiltersType) {
    const {
        showMatched,
        showUnmatchedGtfs,
        showUnmatchedOsm,

        filterBy
    } = filters;

    if (filterBy && filterBy.length > 0) {
        const tripStopsIds = new Set();
        const filterByTrips: GTFSTripUnion[] = [];
        const filterByOsmTrips: OSMRelation[] = [];

        filterBy.forEach(filter => {
            if (filter instanceof GTFSRoute) {
                filterByTrips.push(...filter.trips);
            }
            else if (filter instanceof GTFSTripUnion) {
                filterByTrips.push(filter);
            }
        });
        
        filterBy.forEach(filter => {
            if (filter instanceof OsmRoute) {
                filterByOsmTrips.push(...filter.tripRelations);
            }
            else if ((filter as OSMRelation).type === 'relation') {
                filterByOsmTrips.push(filter as OSMRelation);
            }
        });
        
        filterByTrips.forEach(trip => {
            trip.stopSequence.forEach(stop => {
                tripStopsIds.add(stop.id);
            });
        });

        // At this stage we filtered stops by GTFS trips and routes
        const filtered = [...matchData.matched, ...matchData.unmatchedGtfs]
            .filter(match => tripStopsIds.has(match.gtfsStop?.id));

        // Add stops filtered by OSM trips or routes
        filterByOsmTrips.forEach(osmTrip => {

            const platforms = osmTrip.members
                .filter(m => m.role === 'platform' || m.role === 'stop_position' || m.type === 'node');

            platforms.forEach(member => {
                const match = matchData?.findMatchByOsmElementTypeAndId(member.type, member.ref);

                // TODO: filtered.includes is probabbly inneficient
                if (match && !filtered.includes(match)) {
                    filtered.push(match);
                }
            });
        });

        return filtered;
    }

    const results = [];

    showMatched && results.push(...matchData.matched);
    showUnmatchedGtfs && results.push(...matchData.unmatchedGtfs);
    showUnmatchedOsm && results.push(...matchData.unmatchedOsm);

    return results;
}