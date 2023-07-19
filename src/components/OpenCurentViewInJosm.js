import React, {useCallback, useContext, useEffect, useRef} from "react";

import { MapContext } from "./Map";
import { loadInJOSM } from "../services/JOSMRemote";

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
    }
});

const controlInstance = new OpenInJOSMControl({position: 'topright'});

export default function OpenCurentViewInJosm({filteredMatches}) {

    const map  = useContext(MapContext);

    const cb = useCallback(() => {
        if (filteredMatches && map) {
            const bounds = map.getBounds();
            const osmElements = [];
            
            filteredMatches.forEach(({osmStop}) => {
                if (osmStop) {
                    const {stopPosition, platform} = osmStop;
                    if (stopPosition && bounds.contains({lat: stopPosition.lat, lng: stopPosition.lon})) {
                        osmElements.push(stopPosition);
                    }
                    if (platform && bounds.contains({lat: platform.lat, lng: platform.lon})) {
                        osmElements.push(platform);
                    }
                }
            });

            loadInJOSM(osmElements, true);
        }
    }, [map, filteredMatches]);

    useEffect(() => {
        controlInstance.onClick = cb;
    }, [cb]);

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