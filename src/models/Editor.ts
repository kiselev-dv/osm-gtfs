import { LatLngLiteral } from "leaflet";
import { StopMatchData } from "../services/Matcher";
import { StopMatch } from "../services/Matcher.types";
import OSMData from "../services/OSMData";
import { OSMElementTags } from "../services/OSMData.types";
import OsmStop from "./OsmStop";

export const SET_MATCH = 'set_match';
export const CREATE_NEW = 'create_new';
export const SET_POSITION = 'set_position';

export type EditorActionData = {
    latlng?: LatLngLiteral
    newMatch?: StopMatch
};

export type doneEditCB = (editData: EditorActionData) => void;

export type EditorActionEnum = 'set_match' | 'create_new' | 'set_position';
export type EditorRoleEnum = 'platform' | 'stopPosition';

export type EditorAction = {
    action: EditorActionEnum
    match: StopMatch
    role: EditorRoleEnum
    options: any
    data: EditorActionData
};

export type EditSubjectType = {
    action: EditorActionEnum
    match: StopMatch
    role: EditorRoleEnum
};

export function applyAction(
    {action, match, role, options, data}: EditorAction,
    osmData: OSMData,
    matchData: StopMatchData
) {

    if (action === CREATE_NEW) {
        const name = match?.gtfsStop?.name;
        const code = match?.gtfsStop?.code;
    
        const gtfsRefTag =  matchData.settings.refTag;

        const {platformTemplate, stopPositionTemplate} = options;
        const latlng = data.latlng;

        if (!latlng) {
            return {
                success: false,
            }
        }
    
        const template = role === 'platform' ? platformTemplate : stopPositionTemplate;

        const osmElement = osmData.createNewNode(latlng, {
            name: name,
            [gtfsRefTag]: code,
            ...template
        });
    
        const stopPosition = undefined;
        const platform = osmElement;
    
        const osmStop = new OsmStop(stopPosition, platform);
        const matchSet = matchData.setMatch(match, osmStop);

        return {
            success: matchSet,
            matchDataUpdated: matchSet
        }
    }

    if (action === SET_POSITION) {
        const latlng = data.latlng;

        if (!latlng) {
            return {
                success: false,
            }
        }

        const osmStop = match.osmStop;
        const osmElement = osmStop?.[role];

        if (osmElement?.type === 'node') {
            osmData.setNodeLatLng(latlng, osmElement);
        }

        if (osmElement?.type === 'way') {
            // Move all nodes of a way
            osmData.setWayLatLng(latlng, osmElement);
        }

        return {
            success: true,
            matchDataUpdated: false,
            osmDataUpdated: true
        }
    }

    if (action === SET_MATCH) {

        const newMatch = data.newMatch;

        if (!newMatch) {
            return {
                success: false,
                matchDataUpdated: false,
                osmDataUpdated: false
            }
        }

        const newOsmStop = newMatch.osmStop;
        const osmElement = newOsmStop?.[role || 'platform'];

        if (!newOsmStop || !osmElement) {
            return {
                success: false
            };
        }

        const code = match?.gtfsStop?.code;
        const gtfsRefTag =  matchData.settings.refTag;

        // @ts-ignore
        if (osmElement[gtfsRefTag]) {
            console.warn(`Overwrite ${gtfsRefTag} on osm element`, osmElement);
        }

        const newTags = {
            ...osmElement.tags,
            [gtfsRefTag]: code
        }

        osmData.setElementTags(newTags as OSMElementTags, osmElement);

        return matchData.setMatchToMatch(match, newMatch);
    }

    return {
        success: false,
        error: 'unknow_action'
    }

}