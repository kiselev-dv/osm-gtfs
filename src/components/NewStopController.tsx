import { LeafletMouseEventHandlerFn } from "leaflet";
import { useCallback, useContext, useEffect } from "react";
import { EditSubjectType, doneEditCB } from "../models/Editor";
import { MapContext, layers } from "./Map";

export type NewStopControllerProp = {
    editSubj: EditSubjectType
    doneEdit: doneEditCB
};
export default function NewStopController({doneEdit}: NewStopControllerProp) {
    
    const map = useContext(MapContext);

    const mapClick = useCallback<LeafletMouseEventHandlerFn>(({latlng}) => {
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
