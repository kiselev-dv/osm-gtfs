
import React, { useCallback, useState } from 'react';

export default function MatchEditor({
    match, elementRole, 
    rematchSubj, setRematchSubj,
    moveMatchSubj, setMoveMatchSubj,
    newStopSubj, setNewStopSubj
}) {

    const reassignButtonHandler = useCallback(() => {
        setRematchSubj({
            match,
            role: elementRole
        });
    }, [match, elementRole, setRematchSubj]);
    
    const createButtonHandler = useCallback(() => {
        setNewStopSubj({
            match,
            role: elementRole
        });
    }, [match, elementRole, setNewStopSubj]);
    
    const moveButtonHandler = useCallback(() => {
        setMoveMatchSubj({
            match,
            role: elementRole
        });
    }, [match, elementRole, setMoveMatchSubj]);

    const osmStop = match.osmStop;
    const gtfsStop = match.gtfsStop;

    const osmElement = osmStop?.[elementRole];
    const orphantOsm = osmStop && !gtfsStop;

    return (
        <div>
            { !osmStop && 
            <button onClick={ createButtonHandler }
                disabled={newStopSubj?.match === match}>
                Create
            </button> }
            
            { osmElement && 
            <button 
                disabled={moveMatchSubj?.match === match}
                onClick={moveButtonHandler}>
                Move
            </button> }

            {!orphantOsm && 
            <button 
                disabled={rematchSubj?.match === match} 
                onClick={reassignButtonHandler}
            >
                {!osmElement ? "Assign" : "Reassign"}
            </button>}

            {orphantOsm && 
            <button>
                Delete
            </button>}
        </div>
    );

}