import React, { useCallback, useEffect } from "react";
import MapMatchMarker from "./MapMatchMarker";

export default function RematchController({rematchSubj, assignMatch, matchData, osmData}) {
    
    const osmOrphants = matchData.unmatchedOsm;

    const onSelect = useCallback(selection => {
        console.log('Selected rematch', selection);
        assignMatch(selection, rematchSubj);
    }, [assignMatch, rematchSubj]);

    const markers = osmOrphants.map(match => 
        <MapMatchMarker 
            key={match.id} 
            selectMatch={onSelect} 
            match={match}
            />
    );

    return <>
        <MapMatchMarker 
            key={rematchSubj.match.id} 
            match={rematchSubj.match} 
            selectedMatch={rematchSubj.match}
        />
        { markers}
    </>
}

function RematchMarker ({ osmElement, elementRole, onSelect }) {

}