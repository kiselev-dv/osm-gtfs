import React, { useCallback, useContext, useEffect } from "react";
import { MapContext, layers } from "./Map";

export default function NewStopController({editSubj, doneEdit}) {
    
    const map = useContext(MapContext);

    const mapClick = useCallback(({latlng}) => {
        doneEdit && doneEdit({latlng})
    }, [doneEdit, map]);

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
