import React, { useCallback, useMemo, useState } from 'react';
import './App.css';

import Map from './components/Map'
import GTFSLoad from './components/GTFSLoad';
import MatchList from './components/MatchList';
import MatchSettings, {matchSettingsMatch} from './components/MatchSettings';
import MatchDetails from './components/MatchDetails';
import MapMatchMarker from './components/MapMatchMarker';
import QeryOSM from './components/QueryOSM';

import { StopsMatch } from './services/Matcher';
import { StopMatchesSequence } from './models/StopMatchesSequence';
import MapTrip from './components/MapTrip';
import RematchController from './components/RematchController';
import NewStopController from './components/NewStopController';
import OsmStop from './models/OsmStop';
import StopMoveController from './components/StopMoveController';
import classNames from 'classnames';
import { Changes } from './components/Changes';
import { filterMapKeys, findMostPopularTag } from './services/utils';

function App() {

    const [activeTab, selectTab] = useState('import');

    const [gtfsData, setGtfsData] = useState();
    const onGtfsLoaded = useCallback(data => {
        setGtfsData(data);
    }, []);

    const [osmData, setOSMData] = useState();
    const [matchSettings, setMatchSettings] = useState({
        refTag: 'gtfs:ref',
        matchByName: false,
        matchByCodeInName: false,
        // nameTemplate: "$code - $name.re('\(.*\)', '')"
    });

    const [matchData, setMatchData] = useState();
    const [filteredMatches, setFilteredMatches] = useState();
    const [gtfsTags, setGtfsTags] = useState();

    const [selectedMatch, selectMatch] = useState();
    const [highlightedTrip, setHighlightedGtfsTrip] = useState();
    const [highlightedMatchTrip, setHighlightedMatchTrip] = useState();

    const setHighlightedTrip = useCallback(gtfsTrip => {
        setHighlightedGtfsTrip(gtfsTrip);

        const stopMatchSequence = (matchData && gtfsTrip) ? 
            new StopMatchesSequence(gtfsTrip, matchData) : undefined;

        setHighlightedMatchTrip(stopMatchSequence);
    }, [setHighlightedGtfsTrip, setHighlightedMatchTrip, matchData]);

    const runMatch = useCallback(() => {
        const match = new StopsMatch(matchSettings, gtfsData, osmData);
        setMatchData(match);
        setFilteredMatches(match.matched);
        selectTab('stops');
    }, [matchSettings, gtfsData, osmData, setMatchData]);

    const handleOsmData = useCallback((data) => {
        const tagStats = data.calculateTagStatistics();
        const refTags = filterMapKeys(tagStats, /gtfs|ref/);
        setGtfsTags(refTags);

        findMostPopularTag(refTags, 50, tagKey => {
            setMatchSettings({
                ...matchSettings,
                refTag: tagKey
            });
        });

        setOSMData(data);

    }, [setGtfsTags, setOSMData, matchSettings, setMatchSettings]);

    const matchDone = matchSettingsMatch(matchSettings, matchData?.settings);
    
    const dataBBOX = gtfsData && gtfsData.bbox;

    const possibleOSMRefTags = Object.entries(gtfsTags || {})
        .map(([key, val]) => <span key={key}><code>{key}</code> ({val} objects) </span>);

    // Show osm stops on map to match them with GTFS Stop
    const [rematchSubj, setRematchSubj] = useState();
    const assignMatch = useCallback(osmElement => {
        const { match, elementRole } = rematchSubj;

        setRematchSubj(undefined);
    }, [rematchSubj, setRematchSubj]);

    const [newStopSubj, setNewStopSubj] = useState();
    const assignNewStop = useCallback(latlng => {
        const {match, role} = newStopSubj;
        
        const name = match?.gtfsStop?.name;
        const code = match?.gtfsStop?.code;

        const gtfsRefTag =  matchData.settings.refTag;

        const osmElement = osmData.createNewNode(latlng, {
            name: name,
            "public_transport": "platform",
            "highway": "bus_stop",
            [gtfsRefTag]: code,
        });

        const stopPosition = undefined;
        const platform = osmElement;

        const osmStop = new OsmStop(stopPosition, platform);

        if (matchData.setMatch(match, osmStop)) {
            setMatchData(matchData);
            selectMatch({...match});
        }

        setNewStopSubj(undefined);
    }, [newStopSubj, setNewStopSubj, osmData, matchData, selectMatch]);

    const [moveMatchSubj, setMoveMatchSubj] = useState();
    const onPositionUpdate = useCallback((latlng, subj) => {
        const osmStop = subj.match.osmStop;
        const osmElement = osmStop?.[subj.role];

        // Always true atm
        if (osmElement.type === 'node') {
            osmData.updateNodeLatLng(latlng, osmElement);
            osmStop._updatePosition();

            selectMatch(subj.match);
            setHighlightedMatchTrip({...highlightedMatchTrip});
            //setFilteredMatches(filteredMatches);
        }
        setMoveMatchSubj(undefined);

    }, [setMoveMatchSubj, osmData, matchData, selectMatch, 
        highlightedMatchTrip, setHighlightedMatchTrip, 
        filteredMatches, setFilteredMatches]);

    const hideMarkers = rematchSubj || newStopSubj;

    const matchMarkers = filteredMatches?.map(match => 
        <MapMatchMarker key={match.id} {...{match, selectedMatch, selectMatch}}></MapMatchMarker>
    );

    return <>
        <div className={'main-container'}>
            <div className={'main-left'}>
                <div className={'tab-header'}>
                    <span 
                        className={classNames('tab-selector', {active: activeTab==='import'})} 
                        onClick={() => {selectTab('import')}} key={'import'}>
                            Import
                    </span>
                    <span 
                        className={classNames('tab-selector', {active: activeTab==='stops'})} 
                        onClick={() => {selectTab('stops')}} key={'stops'}>
                            Stops
                    </span>
                    <span 
                        className={classNames('tab-selector', {active: activeTab==='changes'})} 
                        onClick={() => {selectTab('changes')}} key={'changes'}>
                            Changes
                    </span>
                </div>
                <div className={classNames('tab', 'import-tab', {active: activeTab === 'import'})}>
                    <GTFSLoad gtfsData={gtfsData} onDataLoaded={onGtfsLoaded} />

                    <QeryOSM setOSMData={handleOsmData} {...{gtfsData, osmData}}></QeryOSM>

                    { gtfsTags && <div>Posible GTFS stop code tags: {possibleOSMRefTags}</div> }
                    { gtfsData && <MatchSettings {...{gtfsTags, matchSettings, setMatchSettings, matchDone, runMatch}}/> }

                    { osmData && <button disabled={matchDone} onClick={runMatch}>Run match</button>}
                </div>

                <div className={classNames('tab', 'stops-tab', {active: activeTab === 'stops'})}>
                    {selectedMatch &&
                        <MatchDetails match={selectedMatch} 
                            {...{osmData, gtfsData, 
                                highlightedTrip, setHighlightedTrip, 
                                rematchSubj, setRematchSubj,
                                moveMatchSubj, setMoveMatchSubj,
                                newStopSubj, setNewStopSubj
                            }}/>
                    }

                    {matchData && <MatchList {...{
                        matchData, gtfsData,
                        filteredMatches, setFilteredMatches,
                        selectedMatch, selectMatch
                    }}></MatchList>}
                </div>

                <div className={classNames('tab', 'changes-tab', {active: activeTab === 'changes'})}>
                    <Changes {...{osmData}} />
                </div>
            </div>

            <div className={'main-right'}>
                {<Map bbox={dataBBOX}>
                    <MapTrip matchTrip={highlightedMatchTrip} />
                    { !hideMarkers && matchMarkers }
                    {rematchSubj && <RematchController 
                        {...{rematchSubj, assignMatch, matchData, osmData}}/> }
                    {newStopSubj && <NewStopController
                        {...{ newStopSubj, assignNewStop }}/> }
                    {moveMatchSubj && <StopMoveController
                        {...{ moveMatchSubj, onPositionUpdate }}/> }
                </Map>}
            </div>
        </div>
    </>;
}

export default App;