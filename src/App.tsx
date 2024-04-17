import classNames from 'classnames';
import { useCallback, useMemo, useState } from 'react';
import './App.css';

import GTFSLoad from './components/GTFSLoad';
import Map from './components/Map';
import MapMatchMarker from './components/MapMatchMarker';
import MapTrip from './components/MapTrip';
import MatchDetails from './components/MatchDetails';
import MatchList from './components/MatchList';
import MatchSettings, { matchSettingsMatch } from './components/MatchSettings';
import NewStopController from './components/NewStopController';
import OpenCurentViewInJosm from './components/OpenCurentViewInJosm';
import QeryOSM from './components/QueryOSM';
import RematchController from './components/RematchController';
import RouteMatch, { RoutesMatchFilters } from './components/RouteMatch';
import StopMoveController from './components/StopMoveController';

import { Changes } from './components/Changes';
import { TagEditor } from './components/OsmTags';
import RouteTripsEditor, { RouteTripsEditorContext } from './components/RouteTripsEditor';
import { CREATE_NEW, EditSubjectType, SET_MATCH, SET_POSITION, applyAction, doneEditCB } from './models/Editor';
import { ListFiltersType, defaultFilters, filterMatches } from './models/Filters';
import GTFSData, { GTFSTripUnion } from './models/GTFSData';
import { StopMatchesSequence } from './models/StopMatchesSequence';
import { RoutesMatch, StopMatchData } from './services/Matcher';
import { MatchSettingsType, StopMatch } from './services/Matcher.types';
import OSMData, { TagStatistics } from './services/OSMData';
import { OSMElementTags } from './services/OSMData.types';
import { filterTagStatsByRe, findMostPopularTag } from './services/utils';


type GTFSDataCB = (data: GTFSData) => void;
type setHighlightedTrip = (gtfsTrip?: GTFSTripUnion) => void;
type handleSelectInTrip = (match: StopMatch, gtfsTrip: GTFSTripUnion) => void;
type handleOsmDataCB = (osmData: OSMData) => void;

function App() {

    const [activeTab, selectTab] = useState('import');

    const [gtfsData, setGtfsData] = useState<GTFSData>();
    const onGtfsLoaded = useCallback<GTFSDataCB>(data  => {
        setGtfsData(data);
    }, []);

    const [osmData, setOSMData] = useState<OSMData>();
    const [matchSettings, setMatchSettings] = useState<MatchSettingsType>({
        refTag: 'gtfs:ref',
        matchByName: false,
        matchByCodeInName: false,
    });

    const [matchData, setMatchData] = useState<StopMatchData>();
    const [gtfsTags, setGtfsTags] = useState<TagStatistics>();

    const [filters, setFilters] = useState<ListFiltersType>(defaultFilters);

    const [selectedMatch, selectMatch] = useState<StopMatch>();
    const [highlightedTrip, setHighlightedGtfsTrip] = useState<GTFSTripUnion>();
    const [highlightedMatchTrip, setHighlightedMatchTrip] = useState<StopMatchesSequence>();
    const [routesMatch, setRoutesMatch] = useState<RoutesMatch>();
    const [routeEditorSubj, setRouteEditorSubj] = useState<RouteTripsEditorContext>({});

    const [platformTemplate, setPlatformTemplate] = useState<OSMElementTags>({
        'public_transport': 'platform',
        'highway': 'bus_stop',
    });

    const setHighlightedTrip = useCallback<setHighlightedTrip>(gtfsTrip => {
        setHighlightedGtfsTrip(gtfsTrip);

        const stopMatchSequence = (matchData && gtfsTrip) ?
            new StopMatchesSequence(gtfsTrip, matchData) : undefined;

        setHighlightedMatchTrip(stopMatchSequence);
    }, [setHighlightedGtfsTrip, setHighlightedMatchTrip, matchData]);

    const handleSelectNextInTrip = useCallback<handleSelectInTrip>((match, gtfsTrip) => {
        const inx = gtfsTrip.stopSequence.findIndex(stop => stop.id === match.gtfsStop!.id);
        if (inx >= 0) {
            const targetId = gtfsTrip.stopSequence[inx + 1]?.id;
            const targetMatch = matchData!.matchByGtfsId[targetId];
            if (targetMatch) {
                selectMatch(targetMatch);
            }
        }
        
    }, [matchData, selectMatch]);
    
    const handleSelectPrevInTrip = useCallback<handleSelectInTrip>((match, gtfsTrip) => {
        const inx = gtfsTrip.stopSequence.findIndex(stop => stop.id === match.gtfsStop!.id);
        if (inx >= 0) {
            const targetId = gtfsTrip.stopSequence[inx - 1]?.id;
            const targetMatch = matchData!.matchByGtfsId[targetId];
            if (targetMatch) {
                selectMatch(targetMatch);
            }
        }
        
    }, [matchData, selectMatch]);

    
    const handleOsmData = useCallback<handleOsmDataCB>((data) => {
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

    const runMatch = useCallback(() => {
        if (!gtfsData || !osmData) {
            return;
        }

        const match = new StopMatchData(matchSettings, gtfsData, osmData);

        setRoutesMatch(new RoutesMatch(matchSettings, gtfsData, osmData, match));

        setMatchData(match);
        selectTab('stops');
    }, [matchSettings, gtfsData, osmData, setMatchData]);

    const filteredMatches = useMemo(() => {
        return matchData && filterMatches(matchData, filters);
    }, [matchData, matchData?.matched, filters]);

    // Editor state
    const [editSubj, setEditSubj] = useState<EditSubjectType>();
    const doneEdit = useCallback<doneEditCB>(editData => {
        if (!editSubj || !osmData || !matchData) {
            return;
        }

        const {action, match, role} = editSubj;

        const actionDef = {
            action,
            match,
            role,
            options: { platformTemplate },
            data: editData
        };

        // @ts-ignore
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
                        className={classNames('tab-selector', {active: activeTab==='trips'})}
                        onClick={() => {selectTab('trips')}} key={'trips'}>
                            Trips
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
                    {selectedMatch && osmData && gtfsData && matchData &&
                        <MatchDetails match={selectedMatch}
                            {...{osmData, gtfsData, selectMatch, matchData,
                                highlightedTrip, setHighlightedTrip,
                                handleSelectNextInTrip, handleSelectPrevInTrip,
                                editSubj, setEditSubj
                            }}/>
                    }

                    {matchData && gtfsData && <MatchList {...{
                        matchData,
                        gtfsData,
                        filteredMatches,
                        filters, setFilters,
                        selectedMatch, selectMatch
                    }}></MatchList>}
                </div>

                <div className={classNames('tab', 'routes-tab', {active: activeTab === 'routes'})}>
                    <RoutesMatchFilters {...{filters, setFilters}}/>
                    <div className={classNames('scroll-pane', 'routes-list')}>
                        <h4>Matched</h4>
                        { matchData && routesMatch?.matched?.map(r =>
                            <RouteMatch key={r.gtfsRoute!.id}
                                routeMatch={r} stopMatchData={matchData}
                                {...{routeEditorSubj, setRouteEditorSubj}}
                                {...{filters, setFilters}}
                            />)
                        }
                        
                        <h4>Unmatched GTFS</h4>
                        { matchData && routesMatch?.unmatchedGtfs?.map(r =>
                            <RouteMatch key={r.gtfsRoute!.id}
                                routeMatch={r} stopMatchData={matchData}
                                {...{routeEditorSubj, setRouteEditorSubj}}
                                {...{filters, setFilters}} />)
                        }
                        
                        <h4>Unmatched OSM</h4>
                        { matchData && routesMatch?.unmatchedOsm?.map(r =>
                            <RouteMatch key={ r.osmRoute!.ref }
                                routeMatch={r} stopMatchData={matchData}
                                {...{routeEditorSubj, setRouteEditorSubj}}
                                {...{filters, setFilters}} />)
                        }
                        
                        <h4>OSM Routes without ref</h4>
                        { routesMatch?.noRefRelations?.map(r => <div key={ r.id }>{ r.tags.name }</div>) }
                    </div>
                </div>

                <div className={classNames('tab', 'trips-tab', {active: activeTab === 'trips'})}>
                    <RouteTripsEditor {...{routeEditorSubj, setRouteEditorSubj}} />
                </div>

                <div className={classNames('tab', 'changes-tab', {active: activeTab === 'changes'})}>
                    <div className={'scroll-pane'}>
                        <Changes {...{osmData}} />
                    </div>
                </div>
            </div>

            <div className={'main-divider'}></div>

            <div className={'main-right'}>
                {<Map bbox={dataBBOX} center={ceneter}>
                    <OpenCurentViewInJosm filteredMatches={filteredMatches}/>
                    
                    {highlightedMatchTrip &&
                        <MapTrip matchTrip={highlightedMatchTrip} />}
                    
                    { !hideMarkers && matchMarkers }

                    { doRematch && matchData && <RematchController
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