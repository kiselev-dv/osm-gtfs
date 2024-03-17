import { useCallback, useState } from 'react';

import { expandBBOX } from '../models/BBOX';
import GTFSData from '../models/GTFSData';
import OSMData, { queryRoutes, queryStops } from '../services/OSMData';


export type QeryOSMProps = {
    gtfsData?: GTFSData
    osmData?: OSMData
    setOSMData: (osmData: OSMData) => void
};

// TODO: remove osmData from props and use singleton,
// or use osmData provided via props instead of singleton
// basically just need to check that
// `const _osmData = osmData || OSMData.getInstance();` works

// @ts-ignore osmData is never read localy
export default function QeryOSM({gtfsData, osmData, setOSMData}: QeryOSMProps) {

    const [qeryInProgress, setQueryInProgress] = useState(false);

    const queryOSMCallback = useCallback(async () => {
        if(gtfsData && gtfsData.bbox) {
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
        else {
            console.warn("Can't query OSM gtfsData or gtfsData.bbox is empty");
        }
    }, [gtfsData, setQueryInProgress]);

    return <>
       { gtfsData && <button disabled={qeryInProgress} onClick={ queryOSMCallback }>Query OSM data</button> }
    </>
}
