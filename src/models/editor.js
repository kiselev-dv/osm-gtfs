
export function applyAction({action, match, role, options, data}, osmData, matchData) {

    if (action === 'create_new') {
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
    
        return matchData.setMatch(match, osmStop);
    }

    if (action === 'set_position') {
        const osmStop = match.osmStop;
        const osmElement = osmStop?.[role];

        if (osmElement?.type === 'node') {
            osmData.setNodeLatLng(latlng, osmElement);
        }

        if (osmElement?.type === 'way') {
            // Move all nodes of a way
            osmData.setWayLatLng(latlng, osmElement);
        }
    }

    if (action === 'set_match') {

        const { newMatch } = data;
        const newOsmStop = newMatch.osmStop;
        const osmElement = newOsmStop?.[role || 'platform'];

        if (!newOsmStop || !osmElement) {
            return false;
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

}