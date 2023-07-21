import React, { useCallback, useEffect } from "react";
import MapMatchMarker from "./MapMatchMarker";

export default function RematchController({rematchSubj, assignMatch, matchData, osmData}) {
    
    const osmOrphants = matchData.unmatchedOsm;

    const onSelect = useCallback(match => {
        assignMatch(match[rematchSubj.role]);
    }, [assignMatch, rematchSubj]);

    const markers = osmOrphants.map(match => 
        <MapMatchMarker 
            key={match.id} selectMatch={onSelect} 
            {...{match, undefined}} />
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