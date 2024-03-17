import * as Papa from 'papaparse';
import { LonLat } from '../services/OSMData.types';
import BBOX from './BBOX';
import { lonLatToMerc } from './MercatorUtil';

type RawData = {data: any}
type RawCSV = any;

export default class GTFSData {
    stops: GTFSStop[]
    bbox: BBOX | null
    routes: {[routeId: string]: GTFSRoute}
    stopById: {[stopId: string]: GTFSStop}
    stopToTrips: {[stopId: string]: GTFSTripUnion[]}

    constructor() {
        this.stops = [];
        this.routes = {};
        this.stopById = {};
        this.stopToTrips = {};
        this.bbox = null;
    }

    
    loadStops(rawdata: RawCSV) {
        let sampled = false;
        Papa.parse(rawdata, {
            header: true,
            step: ({data: stopData}: RawData) => {
                if ( !stopData.stop_id ) {
                    return;
                }

                if (!sampled) {
                    sampled = true;
                    console.log('Stop raw data sample', stopData);
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

        this.bbox = new BBOX(this.stops[0].lon, this.stops[0].lat, this.stops[0].lon, this.stops[0].lat);
        this.stops.forEach(stop => this.bbox?.extend(stop.lon, stop.lat));
    }

    loadRoutes(rawRoutes: RawCSV, rawTrips: RawCSV, rawStopTimes: RawCSV) {
        let routeDataSample = false;
        Papa.parse(rawRoutes, {
            header: true,
            step: ({data: routeData}: RawData) => {
                if (!routeDataSample) {
                    routeDataSample = true;
                    console.log('Route raw data sample', routeData);
                }

                const route = new GTFSRoute(routeData);
                if (route.id) {
                    this.routes[route.id] = route;
                }
            }
        });
        
        const tripById: {[tripId: string]: GTFSTrip} = {};

        let tripDataSample = false;
        Papa.parse(rawTrips, {
            header: true,
            step: ({data: tripData}: RawData) => {
                if (!tripDataSample) {
                    tripDataSample = true;
                    console.log('Trip raw data sample', tripData);
                }
                const trip = new GTFSTrip(tripData);
                tripById[trip.id] = trip;
            }
        });

        Papa.parse(rawStopTimes, {
            header: true,
            step: ({data: stopTimeData}: RawData) => {
                const {stop_id, trip_id, stop_sequence} = stopTimeData;
                
                const trip = tripById[trip_id];
                const stop = this.stopById[stop_id];

                if(trip && stop) {
                    trip.stopSequence?.push([stop_sequence, stop] as StopSeqTuple);
                }
            }
        });

        Object.values(tripById).forEach(trip => trip.sortSequence());
        
        const tripUnionsById: {[key: string]: GTFSTripUnion} = {};
        Object.values(tripById).forEach(trip => {
            if(tripUnionsById[trip.sequenceId]) {
                tripUnionsById[trip.sequenceId].addTrip(trip);
            }
            else {
                tripUnionsById[trip.sequenceId] = new GTFSTripUnion(trip);
            }
        });

        Object.values(tripUnionsById).forEach(trip => {
            const route = this.routes[trip.routeId];
            if (route) {
                route.trips.push(trip);
            }
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
    
    sequenceId: string
    
    blockId: string
    routeId: string
    directionId: string
    headSign: string
    
    tripIds: string[]
    stopSequence: GTFSStop[]


    constructor(trip: GTFSTrip) {
        const tripRouteId = trip.routeId + trip.headSign + trip.directionId;
        this.sequenceId = trip.sequenceId || tripRouteId;
        
        this.stopSequence = trip.stopSequence.map(s => s[1]);
        
        this.tripIds = [trip.id];
        
        this.blockId = trip.directionId;
        this.routeId = trip.routeId;
        
        this.directionId = trip.directionId;
        
        this.headSign = trip.headSign;
    }

    addTrip(trip: GTFSTrip) {
        if (this.sequenceId === trip.sequenceId) {
            this.tripIds.push(trip.id);
        }
    }
}

type StopSeqTuple = [number, GTFSStop];

export class GTFSTrip {
    id: string
    directionId: string
    blockId: string
    routeId: string
    headSign: string

    stopSequence: StopSeqTuple[]
    sequenceId: string

    constructor(data: any) {
        const { direction_id, block_id, route_id, trip_id, trip_headsign } = data;
        
        this.id = trip_id;
        this.directionId = direction_id;
        this.blockId = block_id;
        this.routeId = route_id;

        this.headSign = trip_headsign;

        this.stopSequence = [];

        this.sequenceId = this.routeId + this.headSign + this.directionId;
    }

    sortSequence() {
        this.stopSequence.sort((a, b) => a[0] - b[0]);
        this.sequenceId = this.stopSequence.map(s => s[1].id).join();
    }
}

export class GTFSRoute {
    id: string
    shortName: string
    longName: string
    trips: GTFSTripUnion[]

    constructor(data: any) {
        const { route_id, route_long_name, route_short_name } = data;
        this.id = route_id;
        this.shortName = route_short_name;
        this.longName = route_long_name;

        this.trips = [];
    }
}

export class GTFSStop {
    id: string
    code: string
    lon: number
    lat: number
    position: L.Point
    name: string

    constructor(data: any) {
        const { parent_station, stop_code, stop_id, stop_name } = data;

        if (parent_station) {
            console.log(`Stop ${stop_code} has parent station ${parent_station}`)
        }

        const { stop_lat, stop_lon } = data;
        
        this.lon = parseFloat(stop_lon);
        this.lat = parseFloat(stop_lat);

        this.position = lonLatToMerc(this.lon, this.lat);

        this.id = stop_id;
        this.code = stop_code;
        this.name = stop_name;
    }

    getLonLat() {
        return {lon: this.lon, lat:this.lat} as LonLat;
    }

}