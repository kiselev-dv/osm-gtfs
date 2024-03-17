import classNames from 'classnames';
import { useCallback } from 'react';
import MatchDetailsTripList from './MatchDetailsTripList';
import MatchEditor from './MatchEditor';
import OSMElementTagsEditor from './OsmTags';

import { EditSubjectType } from '../models/Editor';
import GTFSData, { GTFSTripUnion } from '../models/GTFSData';
import { StopMatch } from '../services/Matcher.types';
import OSMData from '../services/OSMData';
import "./MatchDetails.css";

export type MatchDetailsProps = {
    match: StopMatch
    osmData: OSMData
    gtfsData: GTFSData
    
    highlightedTrip?: GTFSTripUnion
    setHighlightedTrip?: (trip?: GTFSTripUnion) => void
    
    editSubj?: EditSubjectType
    setEditSubj?: (editSubj?: EditSubjectType) => void
    
    handleSelectNextInTrip?: (match: StopMatch, trip: GTFSTripUnion) => void
    handleSelectPrevInTrip?: (match: StopMatch, trip: GTFSTripUnion) => void
};
export default function MatchDetails({
    match, osmData, gtfsData,
    highlightedTrip, setHighlightedTrip,
    editSubj, setEditSubj,
    handleSelectNextInTrip, handleSelectPrevInTrip
}: MatchDetailsProps) {

    const {osmStop, gtfsStop} = match;

    const platform = osmStop?.platform;
    
    // TODO: Properly account for a case when
    // there are both stop position and platform
    // or just stop position

    // @ts-ignore
    const stopPosition = osmStop?.stopPosition;

    const name = osmStop?.getName() || gtfsStop?.name;
    const gtfsCode = gtfsStop?.code;

    const nextInTripHandler = useCallback(() => {
        if (match && highlightedTrip && handleSelectNextInTrip) {
            handleSelectNextInTrip(match, highlightedTrip);
        }
    }, [match, highlightedTrip, handleSelectNextInTrip]);
    
    const prevInTripHandler = useCallback(() => {
        if (match && highlightedTrip && handleSelectPrevInTrip) {
            handleSelectPrevInTrip(match, highlightedTrip);
        }
    }, [match, highlightedTrip, handleSelectPrevInTrip]);

    return <div className={classNames('match-details')}>
        <h4>{ name }</h4>
        { gtfsStop && <div>
            <span>GTFS Stop code: <code>{gtfsCode || 'none'}</code>, </span>
            <span>GTFS Stop id: <code>{gtfsStop?.id}</code></span>
        </div> }

        {highlightedTrip && <><button onClick={prevInTripHandler}>Prev</button> <button onClick={nextInTripHandler}>Next</button></>}

        {gtfsStop && <MatchDetailsTripList {...{gtfsStop, gtfsData, highlightedTrip, setHighlightedTrip}} />}

        { !gtfsStop && <div className={'note'}>
            This stop is marked in OSM, but has no match in GTFS data.
            This stop might be outdated in OSM, check it "on the ground"
            and delete it if it doesn't longer exists.
            </div> }
        
        { !osmStop && gtfsCode && <div className={'note'}>
            This GTFS stop has no matched OSM stop.
            Select one of the OSM stops nearby to set
            GTFS code in its tags.
        </div> }

        { !osmStop && !gtfsCode && <div className={'note'}>
            This GTFS stop has no matched OSM stop, but it
            also doesn't have GTFS code. 
            If there are no GTFS trips associated with it, 
            you should probabbly just ignore it.
        </div> }

        <h4>OSM Stop platform:</h4>
        { platform && <OSMElementTagsEditor osmData={osmData} osmElement={platform} />}

        <MatchEditor elementRole={'platform'} 
            {...{
                match, osmData, gtfsStop,
                editSubj, setEditSubj,
            }} />

    </div>
}


