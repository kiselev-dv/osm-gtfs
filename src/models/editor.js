import OsmStop from "./OsmStop";

export const SET_MATCH = 'set_match';
export const CREATE_NEW = 'create_new';
export const SET_POSITION = 'set_position';

export function applyAction({action, match, role, options, data}, osmData, matchData) {

    if (action === CREATE_NEW) {
        const name = match?.gtfsStop?.name;
        const code = match?.gtfsStop?.code;
    
        const gtfsRefTag =  matchData.settings.refTag;

        const {platformTemplate, stopPositionTemplate} = options;
        const {latlng} = data;
    
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
        const {latlng} = data;
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

        const { newMatch } = data;
        const newOsmStop = newMatch.osmStop;
        const osmElement = newOsmStop?.[role || 'platform'];

        if (!newOsmStop || !osmElement) {
            return {
                success: false
            };
        }

        const code = match?.gtfsStop?.code;
        const gtfsRefTag =  matchData.settings.refTag;

        if (osmElement[gtfsRefTag]) {
            console.warn(`Overwrite ${gtfsRefTag} on osm element`, osmElement);
        }

        const newTags = {
            ...osmElement.tags,
            [gtfsRefTag]: code
        }

        osmData.setElementTags(newTags, osmElement);

        return matchData.setMatchToMatch(match, newMatch);
    }

    return {
        success: false,
        error: 'unknow_action'
    }

}