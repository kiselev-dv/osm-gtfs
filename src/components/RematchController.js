import React, { useCallback, useEffect } from "react";
import MapMatchMarker from "./MapMatchMarker";

export default function RematchController({editSubj, doneEdit, matchData}) {
    
    const osmOrphants = matchData.unmatchedOsm;

    const onSelect = useCallback(selection => {
        doneEdit({
            newMatch: selection
        });
    }, [editSubj, doneEdit]);

    const markers = osmOrphants.map(match => 
        <MapMatchMarker 
            key={match.id} 
            selectMatch={onSelect} 
            match={match}
            />
    );

    return <>
        <MapMatchMarker 
            key={editSubj.match.id} 
            match={editSubj.match} 
            selectedMatch={editSubj.match}
        />
        { markers}
    </>
}

function RematchMarker ({ osmElement, elementRole, onSelect }) {

}