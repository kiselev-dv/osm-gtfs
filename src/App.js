import React, { useCallback, useMemo, useState } from 'react';
import './App.css';

import Map from './components/Map'
import GTFSLoad from './components/GTFSLoad';
import MatchList from './components/MatchList';
import MatchSettings, {matchSettingsMatch} from './components/MatchSettings';
import MatchDetails from './components/MatchDetails';
import MapMatchMarker from './components/MapMatchMarker';
import QeryOSM from './components/QueryOSM';

import { RoutesMatch, StopsMatch, listRouteRelationsOSMData } from './services/Matcher';
import { StopMatchesSequence } from './models/StopMatchesSequence';
import MapTrip from './components/MapTrip';
import RematchController from './components/RematchController';
import NewStopController from './components/NewStopController';
import OsmStop from './models/OsmStop';
import StopMoveController from './components/StopMoveController';
import classNames from 'classnames';
import { Changes } from './components/Changes';
import { filterTagStatsByRe, findMostPopularTag } from './services/utils';
import OpenCurentViewInJosm from './components/OpenCurentViewInJosm';
import { TagEditor } from './components/OsmTags';

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
    const [routesMatch, setRoutesMatch] = useState();

    const [platformTemplate, setPlatformTemplate] = useState({
        'public_transport': 'platform',
        'highway': 'bus_stop',
    });

    const setHighlightedTrip = useCallback(gtfsTrip => {
        setHighlightedGtfsTrip(gtfsTrip);

        const stopMatchSequence = (matchData && gtfsTrip) ? 
            new StopMatchesSequence(gtfsTrip, matchData) : undefined;

        setHighlightedMatchTrip(stopMatchSequence);
    }, [setHighlightedGtfsTrip, setHighlightedMatchTrip, matchData]);

    const runMatch = useCallback(() => {
        const match = new StopsMatch(matchSettings, gtfsData, osmData);

        setRoutesMatch(new RoutesMatch(matchSettings, gtfsData, osmData, match));

        setMatchData(match);
        setFilteredMatches(match.matched);
        selectTab('stops');
    }, [matchSettings, gtfsData, osmData, setMatchData]);

    const handleOsmData = useCallback((data) => {
        const tagStats = data.calculateTagStatistics(el => el.type === 'node');
        const refTags = filterTagStatsByRe(tagStats, /gtfs|ref/);

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

    // Editor state
    const [editSubj, setEditSubj] = useState();
    const doneEdit = useCallback(() => {
        const {action, match, elementRole} = editSubj;


        setEditSubj(undefined);
    }, [editSubj, setEditSubj]);

    // Show osm stops on map to match them with GTFS Stop
    const [rematchSubj, setRematchSubj] = useState();
    const assignMatch = useCallback(osmElement => {
        const { match, elementRole } = rematchSubj;

        setRematchSubj(undefined);
        setEditSubj(undefined);
    }, [editSubj, setEditSubj, rematchSubj, setRematchSubj]);

    const [newStopSubj, setNewStopSubj] = useState();
    const assignNewStop = useCallback(latlng => {
        const {match, role} = newStopSubj;
        
        const name = match?.gtfsStop?.name;
        const code = match?.gtfsStop?.code;

        const gtfsRefTag =  matchData.settings.refTag;

        const osmElement = osmData.createNewNode(latlng, {
            name: name,
            [gtfsRefTag]: code,
            ...platformTemplate
        });

        const stopPosition = undefined;
        const platform = osmElement;

        const osmStop = new OsmStop(stopPosition, platform);

        if (matchData.setMatch(match, osmStop)) {
            setMatchData(matchData);
            selectMatch({...match});
        }

        setNewStopSubj(undefined);
    }, [newStopSubj, setNewStopSubj, platformTemplate, osmData, matchData, selectMatch]);

    const [moveMatchSubj, setMoveMatchSubj] = useState();
    const onPositionUpdate = useCallback((latlng, subj) => {
        const osmStop = subj.match.osmStop;
        const osmElement = osmStop?.[subj.role];

        // Always true atm
        if (osmElement.type === 'node') {
            osmData.setNodeLatLng(latlng, osmElement);

            selectMatch(subj.match);
            setHighlightedMatchTrip({...highlightedMatchTrip});
        }
        if (osmElement.type === 'way') {
            // Move all nodes of a way
            osmData.setWayLatLng(latlng, osmElement);

            selectMatch(subj.match);
            setHighlightedMatchTrip({...highlightedMatchTrip});
        }

        setMoveMatchSubj(undefined);

    }, [setMoveMatchSubj, osmData, matchData, selectMatch, 
        highlightedMatchTrip, setHighlightedMatchTrip, 
        filteredMatches, setFilteredMatches]);

    const possibleOSMRefTags = Object.entries(gtfsTags || {})
        .map(([key, val]) => <div key={key}><code>{key}</code> ({val} objects) </div>);

    const hideMarkers = rematchSubj || newStopSubj;

    const matchMarkers = filteredMatches?.map(match => 
        <MapMatchMarker key={match.id} {...{match, selectedMatch, selectMatch}}></MapMatchMarker>
    );

    const ceneter = (selectedMatch?.osmStop || selectedMatch?.gtfsStop)?.getLonLat();

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
                        className={classNames('tab-selector', {active: activeTab==='routes'})} 
                        onClick={() => {selectTab('routes')}} key={'routes'}>
                            Routes
                    </span>
                    <span 
                        className={classNames('tab-selector', {active: activeTab==='changes'})} 
                        onClick={() => {selectTab('changes')}} key={'changes'}>
                            Changes
                    </span>
                </div>

                <div className={classNames('tab', 'import-tab', {active: activeTab === 'import'})}>
                    <div>
                        <GTFSLoad gtfsData={gtfsData} onDataLoaded={onGtfsLoaded} />

                        <QeryOSM setOSMData={handleOsmData} {...{gtfsData, osmData}}></QeryOSM>

                        { gtfsTags && <div><h4>Posible GTFS stop code tags</h4> {possibleOSMRefTags}</div> }
                        { gtfsData && <MatchSettings {...{gtfsTags, matchSettings, setMatchSettings, matchDone, runMatch}}/> }

                        { osmData && <button disabled={matchDone} onClick={runMatch}>Run match</button>}

                        <h4>Template tags for platform</h4>
                        <TagEditor 
                            tags={platformTemplate} 
                            onChange={t => { setPlatformTemplate(t); }} />
                    </div>
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

                <div className={classNames('tab', 'routes-tab', {active: activeTab === 'routes'})}>
                    <div className={'scroll-pane'}>
                        <h4>Matched</h4>
                        { routesMatch?.matched?.map(r => <div key={r.gtfsRoute.id}>{ r.gtfsRoute.id } { r.osmRoute.name }</div>) }
                        <h4>Unmatched GTFS</h4>
                        { routesMatch?.unmatchedGtfs?.map(r => <div key={r.gtfsRoute.id}>{ r.gtfsRoute.id }</div>) }
                        <h4>Unmatched OSM</h4>
                        { routesMatch?.unmatchedOsm?.map(r => <div key={ r.osmRoute.ref }>{ r.osmRoute.ref } { r.osmRoute.name }</div>) }
                        <h4>OSM Routes without ref</h4>
                        { routesMatch?.noRefRelations?.map(r => <div key={ r.id }>{ r.tags.name }</div>) }
                    </div>
                </div>

                <div className={classNames('tab', 'changes-tab', {active: activeTab === 'changes'})}>
                    <div>
                        <Changes {...{osmData}} />
                    </div>
                </div>
            </div>

            <div className={'main-divider'}></div>

            <div className={'main-right'}>
                {<Map bbox={dataBBOX} center={ceneter}>
                    <OpenCurentViewInJosm filteredMatches={filteredMatches}/>
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