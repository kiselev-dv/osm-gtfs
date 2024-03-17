import L from 'leaflet';
import { useContext, useEffect } from 'react';

import { StopMatchesSequence } from '../models/StopMatchesSequence';
import { MapContext } from './Map';
import './maptrip.css';


type MapTripProps = {
    matchTrip: StopMatchesSequence
};
export default function MapTrip({matchTrip}: MapTripProps) {

    const map = useContext(MapContext);

    useEffect(() => {
        if (matchTrip && !matchTrip.stopMatchSequence) {
            console.warn('Strange matchTrip', matchTrip);
            return;
        }

        console.log('Redraw trip');
        if (map && matchTrip) {

            const latlngs = matchTrip.stopMatchSequence.map(match => {
                const { gtfsStop, osmStop } = match;
                const stop = osmStop || gtfsStop;
                return stop ? stop.getLonLat() : undefined
            })
            .filter(ll => ll !== undefined)
            .map(ll => ({lat: ll!.lat, lng: ll!.lon}));

            const pline = L.polyline(latlngs, {
                className: 'trip-path'
            });

            pline.addTo(map);
            return () => {
                pline.remove();
            };
        }
    }, [map, matchTrip]);

    return <></>
}