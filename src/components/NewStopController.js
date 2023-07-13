import React, { useCallback, useContext, useEffect } from "react";
import { MapContext, layers } from "./Map";

export default function NewStopController({newStopSubj, assignNewStop}) {
    
    const map = useContext(MapContext);

    const mapClick = useCallback((evnt) => {

        assignNewStop(evnt.latlng);

    }, [assignNewStop, map]);

    useEffect(() => {
        if (map) {
            layers.sat.addTo(map);

            map.on('click', mapClick);

            return () => {
                layers.mapnik.addTo(map);
                map.off('click', mapClick);
            };
        }
    }, [map, mapClick]);


    return <></>
}
