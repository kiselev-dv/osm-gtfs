
import React, { useCallback, useState } from 'react';
import { CREATE_NEW, SET_MATCH, SET_POSITION } from '../models/editor';

export default function MatchEditor({
    match, elementRole,
    editSubj, setEditSubj,
}) {

    const reassignButtonHandler = useCallback(() => {
        setEditSubj({
            match,
            action: SET_MATCH,
            role: elementRole
        });
    }, [match, elementRole, setEditSubj]);
    
    const createButtonHandler = useCallback(() => {
        setEditSubj({
            match,
            action: CREATE_NEW,
            role: elementRole
        });
    }, [match, elementRole]);
    
    const moveButtonHandler = useCallback(() => {
        setEditSubj({
            match,
            action: SET_POSITION,
            role: elementRole
        });
    }, [match, elementRole]);

    const osmStop = match.osmStop;
    const gtfsStop = match.gtfsStop;

    const osmElement = osmStop?.[elementRole];
    const orphantOsm = osmStop && !gtfsStop;

    return (
        <div>
            { !osmStop && 
            <button onClick={ createButtonHandler }
                disabled={editSubj?.match === match}>
                Create
            </button> }
            
            { osmElement && 
            <button 
                disabled={editSubj?.match === match}
                onClick={moveButtonHandler}>
                Move
            </button> }

            {!orphantOsm && 
            <button 
                disabled={editSubj?.match === match} 
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