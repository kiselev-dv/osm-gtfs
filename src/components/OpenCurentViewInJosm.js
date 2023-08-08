import React, {useCallback, useContext, useEffect, useRef} from "react";

import { MapContext } from "./Map";
import { loadInJOSM } from "../services/JOSMRemote";
import { getElementLonLat, lonLatToLatLng } from "../services/OSMData";

const OpenInJOSMControl = L.Control.extend({
    onAdd: function(map) {
        var button = L.DomUtil.create('button');
        button.innerText = 'Open in JOSM'
        button.onclick = this.onClick;
        return button;
    },

    onRemove: function(map) {
    },

    onClick: function() {
        console.warn('Empty onclick handler');
    }
});

const controlInstance = new OpenInJOSMControl({position: 'topright'});

export default function OpenCurentViewInJosm({filteredMatches}) {

    const map  = useContext(MapContext);
    const matchesRef = useRef();
    matchesRef.current = filteredMatches;

    controlInstance.onClick = () => {
        const matches = matchesRef.current;
        if (matches && map) {
            const bounds = map.getBounds();
            const osmElements = [];
            
            matches.forEach(({osmStop}) => {
                if (osmStop) {
                    const {stopPosition, platform} = osmStop;
                    
                    const spLatLng = stopPosition && lonLatToLatLng(getElementLonLat(stopPosition));
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