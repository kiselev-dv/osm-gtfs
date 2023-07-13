import React, { useContext, useEffect, useRef } from 'react';
import L from 'leaflet';

import { MapContext } from './Map';

export default function MapMatchMarker({ match, selectedMatch, selectMatch }) {

    const map = useContext(MapContext);
    const markerRef = useRef();

    const gtfsStop = match.gtfsStop;
    const osmStop = match.osmStop;
    
    const {lon, lat} = osmStop || gtfsStop;

    const color = getMatchColor(match);

    useEffect(() => {
        if (map && match) {

            const marker = L.circle({lon, lat}, 3, {color});
            markerRef.current = marker;

            marker.on('click', () => { selectMatch(match); });
            
            marker.addTo(map);
    
            return () => {
                marker.removeFrom(map);
            }
        }
    }, [map, lon, lat, color, selectMatch, match]);

    useEffect(() => {
        if (match && selectedMatch && match === selectedMatch) {
            const marker = markerRef.current;
            if (marker) {
                marker.setRadius(6);

                return () => {
                    marker.setRadius(3);
                };
            }
        }
    }, [map, match, selectedMatch]);

    return <></>;
}


export function getMatchColor(match) {
    const gtfsStop = match.gtfsStop;
    const osmStop = match.osmStop;
    
    if (osmStop && gtfsStop) {
        return '#0000ff';
    }

    // unmatched GTFS
    if (gtfsStop && !osmStop) {
        return gtfsStop.code ? '#ff0000' : '#FF8080';
    }

    // unmatched OSM
    if (osmStop && !gtfsStop) {
        return '#000000'
    }
}
