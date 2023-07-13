import React, { useContext, useEffect, useRef } from 'react';
import L from 'leaflet';

import { MapContext } from './Map';
import './maptrip.css';

/**
 * @typedef {import("../services/Matcher").StopMatch} StopMatch
 */

export default function MapTrip({matchTrip}) {

    const map = useContext(MapContext);

    useEffect(() => {
        console.log('Redraw trip');
        if (map && matchTrip) {
            const latlngs = matchTrip.stopMatchSequence.map(match => {
                const { gtfsStop, osmStop } = match;
                const stop = osmStop || gtfsStop;
                return stop ? [stop.lat, stop.lon] : undefined
            }).filter(ll => ll !== undefined);

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