import React, {useCallback, useState} from 'react';

import OSMData, { queryRoutes, queryStops } from '../services/OSMData';
import { expandBBOX } from '../models/BBOX';

export default function QeryOSM({gtfsData, osmData, setOSMData, setGtfsTags}) {

    const [qeryInProgress, setQueryInProgress] = useState(false);

    const queryOSMCallback = useCallback(async () => {
        if(gtfsData) {
            setQueryInProgress(true);

            const osmData = OSMData.getInstance();
            const bbox = expandBBOX(gtfsData.bbox, 0.001);
            try {
                osmData.updateOverpassData(await queryStops(bbox));
                osmData.updateOverpassData(await queryRoutes(bbox));
            }
            finally {
                setOSMData(osmData);
                setQueryInProgress(false);
            }
        }
    }, [gtfsData, setQueryInProgress, setGtfsTags]);

    return <>
       { gtfsData && <button disabled={qeryInProgress} onClick={ queryOSMCallback }>Query OSM data</button> }
    </>
}
