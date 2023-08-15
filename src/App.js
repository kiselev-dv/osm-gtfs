import React, { useCallback, useState } from 'react';
import classNames from 'classnames';
import './App.css';

import Map from './components/Map'
import GTFSLoad from './components/GTFSLoad';
import MatchList from './components/MatchList';
import MatchSettings, {matchSettingsMatch} from './components/MatchSettings';
import MatchDetails from './components/MatchDetails';
import MapMatchMarker from './components/MapMatchMarker';
import QeryOSM from './components/QueryOSM';
import MapTrip from './components/MapTrip';
import RouteMatch from './components/RouteMatch';
import RematchController from './components/RematchController';
import NewStopController from './components/NewStopController';
import StopMoveController from './components/StopMoveController';
import OpenCurentViewInJosm from './components/OpenCurentViewInJosm';

import { RoutesMatch, StopsMatch } from './services/Matcher';
import { StopMatchesSequence } from './models/StopMatchesSequence';
import { Changes } from './components/Changes';
import { filterTagStatsByRe, findMostPopularTag } from './services/utils';
import { TagEditor } from './components/OsmTags';
import { CREATE_NEW, SET_MATCH, SET_POSITION, applyAction } from './models/editor';

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

    const handleSelectNextInTrip = useCallback((match, gtfsTrip) => {
        const inx = gtfsTrip.stopSequence.findIndex(stop => stop.id === match.gtfsStop.id);
        if (inx >= 0) {
            const targetId = gtfsTrip.stopSequence[inx + 1]?.id;
            const targetMatch = matchData.matchByGtfsId[targetId];
            if (targetMatch) {
                selectMatch(targetMatch);
            }
        }
        
    }, [matchData, selectMatch]);
    
    const handleSelectPrevInTrip = useCallback((match, gtfsTrip) => {
        const inx = gtfsTrip.stopSequence.findIndex(stop => stop.id === match.gtfsStop.id);
        if (inx >= 0) {
            const targetId = gtfsTrip.stopSequence[inx - 1]?.id;
            const targetMatch = matchData.matchByGtfsId[targetId];
            if (targetMatch) {
                selectMatch(targetMatch);
            }
        }
        
    }, [matchData, selectMatch]);

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
    const doneEdit = useCallback(editData => {
        const {action, match, role} = editSubj;

        const actionDef = {
            action,
            match, 
            role,
            options: { platformTemplate },
            data: editData
        };

        const { success, matchDataUpdated } = applyAction(actionDef, osmData, matchData);

        if (success && matchDataUpdated) {
            setMatchData(matchData);
            selectMatch({...match});
        }

        setEditSubj(undefined);
    }, [editSubj, setEditSubj]);

    const possibleOSMRefTags = Object.entries(gtfsTags || {})
        .map(([key, val]) => <div key={key}><code>{key}</code> ({val} objects) </div>);
        
    const doNew = editSubj?.action === CREATE_NEW;
    const doMove = editSubj?.action === SET_POSITION;
    const doRematch = editSubj?.action === SET_MATCH;

    const hideMarkers = doNew || doRematch;

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
                            {...{osmData, gtfsData, selectMatch, matchData,
                                highlightedTrip, setHighlightedTrip,
                                handleSelectNextInTrip, handleSelectPrevInTrip,
                                editSubj, setEditSubj
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
                        { routesMatch?.matched?.map(r => <RouteMatch key={r.gtfsRoute.id} routeMatch={r} />) }
                        
                        <h4>Unmatched GTFS</h4>
                        { routesMatch?.unmatchedGtfs?.map(r => <RouteMatch key={r.gtfsRoute.id} routeMatch={r}/>) }
                        
                        <h4>Unmatched OSM</h4>
                        { routesMatch?.unmatchedOsm?.map(r => <RouteMatch key={ r.osmRoute.ref } routeMatch={r}/>) }
                        
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
                    { doRematch && <RematchController 
                        {...{editSubj, doneEdit, matchData, osmData}}/> }
                    { doNew && <NewStopController
                        {...{editSubj, doneEdit}}/> }
                    { doMove && <StopMoveController
                        {...{editSubj, doneEdit}}/> }
                </Map>}
            </div>
        </div>
    </>;
}

export default App;