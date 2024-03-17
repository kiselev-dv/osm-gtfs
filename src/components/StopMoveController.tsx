import { useContext, useEffect } from 'react';

import { LeafletMouseEventHandlerFn } from 'leaflet';
import { doneEditCB } from '../models/Editor';
import { MapContext } from './Map';

export type StopMoveControllerProps = {
    doneEdit: doneEditCB
};
export default function StopMoveController({doneEdit}: StopMoveControllerProps) {

    const map = useContext(MapContext);

    useEffect(() => {
        if (map) {
            const clickHandler: LeafletMouseEventHandlerFn = ({latlng}) => {
                doneEdit && doneEdit({latlng});
            };

            map.on('click', clickHandler);
            
            return () => {
                map.off('click', clickHandler);
            };
        }
    }, [map, doneEdit]);

    return <></>
}