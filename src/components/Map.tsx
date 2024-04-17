import React, { useEffect, useRef, useState } from 'react';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import BBOX from '../models/BBOX';
import './map.css';

const osmAttribution = '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>';

const satAttribution = `Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye,
Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community`;

export type LFLT_LatLngLike = [number, number];
export type LFLT_View = {
    center: LFLT_LatLngLike,
    zoom: number
};

export type LatLon = {
    lat: number
    lon: number,
};

export const MapContext = React.createContext< L.Map | null >(null);

function latLngBoundsFromBBOX(bbox: BBOX) {
    return [
        [bbox.miny, bbox.minx] as L.LatLngTuple,
        [bbox.maxy, bbox.maxx] as L.LatLngTuple
    ];
}

const mapnik = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxNativeZoom: 19,
    maxZoom: 20,
    attribution: osmAttribution
});


//@ts-ignore
const sat = new L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: satAttribution,
    maxZoom: 20,
    maxNativeZoom: 18,
});

export const layers = {
    mapnik, sat
}

const DarkenControl = L.Control.extend({
    onAdd: function(map: L.Map) {
        const div = L.DomUtil.create('div');
        div.className = 'll-darken-control';
        div.innerHTML = '<label>Darken map </label>';

        const cb = L.DomUtil.create('input');
        cb.type = 'checkbox';
        cb.onclick = function(e: MouseEvent) {
            const target = e.target! as HTMLInputElement;
            if(target.checked) {
                map.getContainer().classList.add('darken');
            }
            else {
                map.getContainer().classList.remove('darken');
            }
        };

        div.appendChild(cb);

        return div;
    },

    onRemove: function() {
    },

});

export type MapProps = {
    children: React.ReactNode,
    center?: LatLon | null,
    bbox?: BBOX | null,
    satellite?: boolean,
    view?: LFLT_View
}

const Map: React.FC<MapProps> = ({children, view, bbox, center, satellite}) => {

    const divRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<L.Map|null>(null);

    useEffect(() => {
        const map = L.map(divRef.current!, {
            center: [0, 0],
            zoom: 3,
            layers: [mapnik]
        });

        L.control.layers({
            "OpenStreetMap": mapnik,
            "Satellite": sat
        }, {}, {collapsed: false}).addTo(map);

        setMap(map);

        new DarkenControl({position: 'topright'}).addTo(map);

        return () => {
            map.remove();
            setMap(null);
        }

    }, []);

    useEffect(() => {
        if (map && view) {
            map.setView(view.center, view.zoom);
        }
    }, [map, view]);
    
    useEffect(() => {
        if (map && center) {
            map.panTo(L.latLng(center.lat, center.lon));
        }
    }, [map, center]);
    
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

export default Map;