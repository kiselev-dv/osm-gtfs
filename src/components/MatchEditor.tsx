
import { useCallback } from 'react';
import { CREATE_NEW, EditSubjectType, EditorRoleEnum, SET_MATCH, SET_POSITION } from '../models/Editor';
import { StopMatch } from '../services/Matcher.types';

export type MatchEditorProps = {
    match: StopMatch
    elementRole: EditorRoleEnum
    editSubj?: EditSubjectType
    setEditSubj?: (subj?: EditSubjectType) => void
};

export default function MatchEditor({
    match, elementRole,
    editSubj, setEditSubj,
}: MatchEditorProps) {

    const reassignButtonHandler = useCallback(() => {
        setEditSubj && setEditSubj({
            match,
            action: SET_MATCH,
            role: elementRole
        });
    }, [match, elementRole, setEditSubj]);
    
    const createButtonHandler = useCallback(() => {
        setEditSubj && setEditSubj({
            match,
            action: CREATE_NEW,
            role: elementRole
        });
    }, [match, elementRole, setEditSubj]);
    
    const moveButtonHandler = useCallback(() => {
        setEditSubj && setEditSubj({
            match,
            action: SET_POSITION,
            role: elementRole
        });
    }, [match, elementRole, setEditSubj]);

    const cancelEditHandler = useCallback(() => {
        setEditSubj && setEditSubj(undefined);
    }, [setEditSubj]);

    const osmStop = match.osmStop;
    const gtfsStop = match.gtfsStop;

    const osmElement = osmStop?.[elementRole];
    const orphantOsm = osmStop && !gtfsStop;

    const editIsActive = editSubj && editSubj?.match === match;
    return (
        <div>
            { editIsActive && 
            <button onClick={ cancelEditHandler }>
                Cancel
            </button> }

            { !osmStop && 
            <button onClick={ createButtonHandler }
                disabled={editIsActive}>
                Create
            </button> }
            
            { osmElement && 
            <button 
                disabled={editIsActive}
                onClick={moveButtonHandler}>
                Move
            </button> }

            {!orphantOsm && 
            <button 
                disabled={editIsActive} 
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