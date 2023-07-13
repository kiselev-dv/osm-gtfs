import React, { useEffect, useRef, useState } from 'react';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import './map.css'

const osmAttribution = '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>';

const satAttribution = `Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, 
Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community`;

export const MapContext = React.createContext({ map: null });

function latLngBoundsFromBBOX(bbox) {
    return [
        [bbox.miny, bbox.minx], 
        [bbox.maxy, bbox.maxx]
    ];
}

const mapnik = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxNativeZoom: 19,
    maxZoom: 20,
    attribution: osmAttribution
});

const sat = new L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: satAttribution,
    maxZoom: 20,
    maxNativeZoom: 18,
});

export const layers = {
    mapnik, sat
}

export default function Map({children, view, bbox, satellite}) {

    const divRef = useRef();
    const [map, setMap] = useState();

    useEffect(() => {
        const map = L.map(divRef.current, {
            center: [0, 0],
            zoom: 3,
            layers: [mapnik]
        });

        L.control.layers({
            "OpenStreetMap": mapnik,
            "Satellite": sat
        }, {}).addTo(map);

        setMap(map);

        return () => {
            map.remove();
            setMap(undefined);
        }

    }, []);

    useEffect(() => {
        if(map && view) {
            map.setView(view.center, view.zoom);
        }
    }, [map, view]);
    
    useEffect(() => {
        if(map && bbox) {
            map.fitBounds(latLngBoundsFromBBOX(bbox));
        }
    }, [map, bbox]);

    useEffect(() => {
        if(map) {
            satellite === true ? sat.addTo(map) : mapnik.addTo(map);
        }
    }, [map, satellite]);

    return (
    <div id='map' ref={divRef}>
        <MapContext.Provider value={map}>
            {children}
        </MapContext.Provider>
    </div>
    );
}