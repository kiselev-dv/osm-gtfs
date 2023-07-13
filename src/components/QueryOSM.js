import React, {useCallback, useState} from 'react';

import OSMData, { queryOverpas } from '../services/OSMData';

export default function QeryOSM({gtfsData, osmData, setOSMData, setGtfsTags}) {

    const [qeryInProgress, setQueryInProgress] = useState(false);

    const queryOSMCallback = useCallback(() => {
        if(gtfsData) {
            setQueryInProgress(true);

            queryOverpas(gtfsData.bbox).then(data => {
                const osmData = OSMData.parseOverpassData(data);
                setOSMData(osmData);

            }).finally(() => {
                setQueryInProgress(false);
            });

        }
    }, [gtfsData, setQueryInProgress, setGtfsTags]);

    return <>
       { gtfsData && <button disabled={qeryInProgress} onClick={ queryOSMCallback }>Query OSM data</button> }
    </>
}
