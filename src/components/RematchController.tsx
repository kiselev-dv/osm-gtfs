import { useCallback } from "react";
import { EditSubjectType, EditorActionData } from "../models/Editor";
import { StopMatchData } from "../services/Matcher";
import { StopMatch } from "../services/Matcher.types";
import MapMatchMarker from "./MapMatchMarker";

export type onSelectCB = (selection?: StopMatch) => void;

export type RematchControllerProps = {
    editSubj: EditSubjectType
    doneEdit: (data: EditorActionData) => void
    matchData: StopMatchData
};
export default function RematchController({editSubj, doneEdit, matchData}: RematchControllerProps) {
    
    const osmOrphants = matchData.unmatchedOsm;

    const onSelect = useCallback<onSelectCB>(selection => {
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
