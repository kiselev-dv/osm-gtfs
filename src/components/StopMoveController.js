import React, { useContext, useEffect } from 'react';

import { MapContext } from './Map';

export default function StopMoveController({moveMatchSubj, onPositionUpdate}) {

    const map = useContext(MapContext);

    useEffect(() => {
        if (map) {
            const clickHandler = ({latlng}) => {
                onPositionUpdate && onPositionUpdate(latlng, moveMatchSubj);
            };

            map.on('click', clickHandler);
            
            return () => {
                map.off('click', clickHandler);
            };
        }
    }, [map, moveMatchSubj, onPositionUpdate]);

    return <></>
}