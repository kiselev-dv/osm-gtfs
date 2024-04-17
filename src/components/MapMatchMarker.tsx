import L from 'leaflet';
import React, { useContext, useEffect, useRef } from 'react';

import { StopMatch } from '../services/Matcher.types';
import { MapContext } from './Map';

type MapMatchMarkerProps = {
    match: StopMatch
    selectedMatch?: StopMatch
    selectMatch?: (match?: StopMatch) => void
};
const MapMatchMarker: React.FC<MapMatchMarkerProps> = ({ match, selectedMatch, selectMatch }) => {

    const map = useContext(MapContext);
    const markerRef = useRef<L.Circle>();

    const gtfsStop = match.gtfsStop;
    const osmStop = match.osmStop;
    
    const lonLat = osmStop?.getLonLat() || gtfsStop;

    const color = getMatchColor(match);

    useEffect(() => {
        if (map && match && lonLat) {
            const {lon, lat} = lonLat;
            
            const marker = L.circle({lng: lon, lat}, 3, {color});
            markerRef.current = marker;

            marker.on('click', () => { selectMatch && selectMatch(match); });
            
            marker.addTo(map);
    
            return () => {
                marker.removeFrom(map);
            }
        }
    }, [map, lonLat, color, selectMatch, match]);

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

export default MapMatchMarker;


export function getMatchColor(match: StopMatch) {
    const gtfsStop = match.gtfsStop;
    const osmStop = match.osmStop;
    
    if (osmStop && gtfsStop) {
        return '#3399FF';
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
