import * as Papa from 'papaparse';
import BBOX from './BBOX';
import { lonLatToMerc } from './MercatorUtil'; 

export default class GTFSData {
    constructor() {
        this.stops = [];

        this.stopById = {};

        this.routes = {};

        this.stopToTrips = {};
    }

    loadStops(rawdata) {
        Papa.parse(rawdata, {
            header: true,
            step: ({data: stopData}) => {
                if ( !stopData.stop_id ) {
                    return;
                }

                const stop = new GTFSStop(stopData);

                const {lon, lat} = stop;
                if (!Number.isNaN(lon) && !Number.isNaN(lat)) {
                    this.stops.push(stop);
                    this.stopById[stop.id] = stop;
                }
                else {
                    console.error('Failed to parse stop coordinates', stop);
                }
            }
        });

        this.bbox = new BBOX(this.stops[0].lon, this.stops[0].lat);
        this.stops.forEach(stop => this.bbox.extend(stop.lon, stop.lat));
    }

    loadRoutes(rawRoutes, rawTrips, rawStopTimes) {
        Papa.parse(rawRoutes, {
            header: true,
            step: ({data: routeData}) => {
                const route = new GTFSRoute(routeData);
                if (route.id) {
                    this.routes[route.id] = route;
                }
            }
        });
        
        const tripById = {};

        Papa.parse(rawTrips, {
            header: true,
            step: ({data: tripData}) => {
                const trip = new GTFSTrip(tripData);
                tripById[trip.id] = trip;
            }
        });

        Papa.parse(rawStopTimes, {
            header: true,
            step: ({data: stopTimeData}) => {
                const {stop_id, trip_id, stop_sequence} = stopTimeData;
                
                const trip = tripById[trip_id];
                const stop = this.stopById[stop_id];

                if(trip && stop) {
                    trip.stopSequence.push([stop_sequence, stop]);
                }
            }
        });

        Object.values(tripById).forEach(trip => trip.sortSequence());
        
        const uniqueTrips = {};
        Object.values(tripById).forEach(trip => {
            if(uniqueTrips[trip.sequenceId]) {
                uniqueTrips[trip.sequenceId].addTrip(trip);
            }
            else {
                uniqueTrips[trip.sequenceId] = new GTFSTripUnion(trip);
            }
        });

        Object.values(uniqueTrips).forEach(trip => {
            const route =this.routes[trip.routeId];
            route?.trips?.push(trip);
        });

        Object.values(this.routes).forEach(route => {
            route.trips.forEach(trip => {
                trip.stopSequence.forEach(stop => {
                    if (!this.stopToTrips[stop.id]) {
                        this.stopToTrips[stop.id] = [];
                    }
                    this.stopToTrips[stop.id].push(trip);
                });
            });
        });
    }
}

export class GTFSTripUnion {
    /**
     * @param {GTFSTrip} trip 
     */
    constructor(trip) {
        /**@type { string } */
        this.sequenceId = trip.sequenceId;
        
        /**@type { GTFSStop[] } */
        this.stopSequence = trip.stopSequence.map(s => s[1]);
        
        /**@type { string[] } */
        this.tripIds = [trip.id];
        
        this.blockId = trip.directionId;
        this.routeId = trip.routeId;
        
        this.directionId = trip.directionId;
        
        /**@type { string } */
        this.headSign = trip.headSign;
    }

    /**
     * @param {GTFSTrip} trip 
     */
    addTrip(trip) {
        if (this.sequenceId === trip.sequenceId) {
            this.tripIds.push(trip.id);
        }
    }
}

export class GTFSTrip {
    constructor(data) {
        const { direction_id, block_id, route_id, trip_id, trip_headsign } = data;
        
        this.id = trip_id;
        this.directionId = direction_id;
        this.blockId = block_id;
        this.routeId = route_id;

        this.headSign = trip_headsign;

        this.stopSequence = [];

        this.sequenceId = null;
    }

    sortSequence() {
        this.stopSequence.sort((a, b) => a[0] - b[0]);
        this.sequenceId = this.stopSequence.map(s => s[1].id).join();
    }

}

export class GTFSRoute {
    constructor(data) {
        const { route_id, route_long_name, route_short_name } = data;
        this.id = route_id;
        this.shortName = route_short_name;
        this.longName = route_long_name;

        this.trips = [];
    }
}

export class GTFSStop {

    constructor(data) {
        const { parent_station, stop_code, stop_id, stop_name } = data; 
        const { stop_lat, stop_lon } = data;
        
        this.lon = parseFloat(stop_lon);
        this.lat = parseFloat(stop_lat);

        this.position = lonLatToMerc(this.lon, this.lat);

        this.id = stop_id;
        this.code = stop_code;
        this.name = stop_name;
    }

}