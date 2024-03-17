import { useContext, useEffect, useRef } from "react";

import L from "leaflet";

import { loadInJOSM } from "../services/JOSMRemote";
import { StopMatch } from "../services/Matcher.types";
import { getElementLonLat, lonLatToLatLng } from "../services/OSMData";
import { OSMElement } from "../services/OSMData.types";
import { MapContext } from "./Map";

const OpenInJOSMControl = L.Control.extend({
    onAdd: function() {
        var button = L.DomUtil.create('button');
        button.innerText = 'Open in JOSM'
        button.onclick = this.onClick;
        return button;
    },

    onRemove: function() {
    },

    onClick: function() {
        console.warn('Empty onclick handler');
    }
});

const controlInstance = new OpenInJOSMControl({position: 'topright'});

export type OpenCurentViewInJosmProps = {
    filteredMatches: StopMatch[]
};
export default function OpenCurentViewInJosm({filteredMatches}: OpenCurentViewInJosmProps) {

    const map  = useContext(MapContext);
    const matchesRef = useRef<StopMatch[]>();
    matchesRef.current = filteredMatches;

    controlInstance.onClick = () => {
        const matches = matchesRef.current;
        if (matches && map) {
            const bounds = map.getBounds();
            const osmElements: OSMElement[] = [];
            
            matches.forEach(({osmStop}) => {
                if (osmStop) {
                    const {stopPosition, platform} = osmStop;
                    
                    // @ts-ignore
                    const spLatLng = stopPosition && lonLatToLatLng(getElementLonLat(stopPosition));
                    // @ts-ignore
                    const plLatLng = platform && lonLatToLatLng(getElementLonLat(platform));

                    if (stopPosition && spLatLng && bounds.contains(spLatLng)) {
                        osmElements.push(stopPosition);
                    }

                    if (platform && plLatLng && bounds.contains(plLatLng)) {
                        osmElements.push(platform);
                    }
                }
            });

            loadInJOSM(osmElements, true);
        }
    };

    useEffect(() => {
        if (map) {
            map.addControl(controlInstance);
            return () => {
                map.removeControl(controlInstance);
            }
        }
    }, [map])

    return <></>
}