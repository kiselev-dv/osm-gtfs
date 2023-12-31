import React, { useCallback } from 'react';
import IconCheckBox from './IconCheckBox';

import './match-details-trip-list.css';

export default function MatchDetailsTripList({gtfsStop, gtfsData, highlightedTrip, setHighlightedTrip}) {

    const tripSelectionHandler = useCallback((gtfsTrip, selected) => {
        setHighlightedTrip && setHighlightedTrip(selected ? gtfsTrip : undefined);
    }, [setHighlightedTrip]);

    const trips = gtfsData.stopToTrips[gtfsStop?.id];

    const tripList = trips?.map((trip, i) => 
        <MatchDetailsTripListElement key={i} 
            gtfsTrip={trip} 
            selected={highlightedTrip === trip}
            onSelectionChange={tripSelectionHandler}
            {...{ gtfsData }} />
    );

    return gtfsStop ? (
    <>
        <h4>Following route trips are going through this stop:</h4>
        <div className={'stop-trip-list'}>
        { tripList }
        </div>
    </>
    ) : <></>;
}

function MatchDetailsTripListElement({gtfsTrip, selected, gtfsData, onSelectionChange}) {
    const handleCheckboxChange = useCallback(checked => {
        onSelectionChange && onSelectionChange(gtfsTrip, checked);
    }, [gtfsTrip, onSelectionChange]);

    const route = gtfsData.routes[gtfsTrip.routeId];

    return (<div className={'stop-trip-list-item'}>
        <IconCheckBox icon={'filter_list'} 
            alt={'filter stops list'} 
        />
        <IconCheckBox icon={'moving'} 
            alt={'show/hide on map'} 
            checked={selected} 
            onChange={handleCheckboxChange} 
        />
        {gtfsTrip.headSign && <span className={'trip-name'}>
        { gtfsTrip.headSign }
        </span>}
        {route && <span className={'route-name'}>
        { `(${route.shortName} - ${route.longName})` }    
        </span>}
    </div>);
}