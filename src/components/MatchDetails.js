import React, { useCallback } from 'react';
import OSMElementTags from './OsmTags';
import MatchDetailsTripList from './MatchDetailsTripList';
import MatchEditor from './MatchEditor';
import classNames from 'classnames';

import "./MatchDetails.css";

export default function MatchDetails({
    match, osmData, gtfsData,
    highlightedTrip, setHighlightedTrip,
    editSubj, setEditSubj,
    handleSelectNextInTrip, handleSelectPrevInTrip
}) {

    const {osmStop, gtfsStop} = match;

    const platform = osmStop?.platform;
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

        <MatchDetailsTripList {...{gtfsStop, gtfsData, highlightedTrip, setHighlightedTrip}} />

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
        { platform && <OSMElementTags osmData={osmData} osmElement={platform} />}

        <MatchEditor elementRole={'platform'} 
            {...{
                match, osmData, gtfsStop,
                editSubj, setEditSubj,
            }} />

    </div>
}


