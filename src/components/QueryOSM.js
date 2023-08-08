import React, {useCallback, useState} from 'react';

import OSMData, { queryRoutes, queryStops } from '../services/OSMData';

export default function QeryOSM({gtfsData, osmData, setOSMData, setGtfsTags}) {

    const [qeryInProgress, setQueryInProgress] = useState(false);

    const queryOSMCallback = useCallback(async () => {
        if(gtfsData) {
            setQueryInProgress(true);

            const osmData = OSMData.getInstance();
            try {
                osmData.updateOverpassData(await queryStops(gtfsData.bbox));
                osmData.updateOverpassData(await queryRoutes(gtfsData.bbox));
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
