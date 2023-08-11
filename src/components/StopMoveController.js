import React, { useContext, useEffect } from 'react';

import { MapContext } from './Map';

export default function StopMoveController({doneEdit}) {

    const map = useContext(MapContext);

    useEffect(() => {
        if (map) {
            const clickHandler = ({latlng}) => {
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