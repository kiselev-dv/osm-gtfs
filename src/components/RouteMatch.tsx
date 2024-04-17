
import classNames from "classnames";
import { useCallback, useState } from "react";
import { ListFiltersType } from "../models/Filters";
import { GTFSRoute, GTFSTripUnion } from "../models/GTFSData";
import { OsmRoute } from "../models/OsmRoute";
import { loadInJOSM } from "../services/JOSMRemote";
import { StopMatchData } from "../services/Matcher";
import { RouteMatchType, StopMatch } from "../services/Matcher.types";
import { OSMRelation } from "../services/OSMData.types";
import "./RouteMatch.css";
import { IRouteTripsEditorState } from "./RouteTripsEditor";

type RouteMatchProps = {
    routeMatch: RouteMatchType,
    stopMatchData: StopMatchData,
} & IMatchesFilter & IRouteTripsEditorState;
export default function RouteMatch({routeMatch, stopMatchData, ...props}: RouteMatchProps) {
    const {gtfsRoute, osmRoute} = routeMatch;

    const id = gtfsRoute?.id || osmRoute?.ref;

    const gtfsRouteTitle = getGTFSRouteName(gtfsRoute);

    const { setRouteEditorSubj } = props;

    const selectCB = useCallback(() => {
        setRouteEditorSubj({
            routeMatch
        });
    }, [routeMatch, setRouteEditorSubj]);

    const routeStops: StopMatch[] = [];
    gtfsRoute?.trips?.forEach(gtfsTrip => {
        gtfsTrip.stopSequence.forEach(s => {
            const match = stopMatchData.matchByGtfsId[s.id];
            routeStops.push(match);
        });
    });

    const matchedStops = routeStops.filter(s => s.osmStop && s.gtfsStop).length;

    return <>
    <div key={id} className={'route-match'}>
        {gtfsRouteTitle && <h5 onClick={selectCB} className={'route-match-gtfs-name'}>{ gtfsRouteTitle }</h5>}
        {
            // @ts-ignore
            osmRoute && <div className={'route-match-osm-name'}>
                <label>OSM Route name:</label>
                <span>{id && osmRoute?.name?.replace(id, '')}</span>
            </div>
        }
        <div className={classNames('match-count', {'all-matched': routeStops.length === matchedStops})}>
            {matchedStops} out of {routeStops.length} stops matched
        </div>
    </div>
    <TripsData {...{gtfsRoute, osmRoute, stopMatchData, ...props}} />
    </>
}

export function getGTFSRouteName(gtfsRoute?: GTFSRoute) {
    return gtfsRoute && (`${gtfsRoute?.shortName} - ${gtfsRoute?.longName}`);
}

type TripsDataProps = {
    gtfsRoute?: GTFSRoute
    osmRoute?: OsmRoute
    stopMatchData?: StopMatchData,
} & IMatchesFilter;
function TripsData({gtfsRoute, osmRoute, stopMatchData, filters, setFilters}: TripsDataProps) {
    const gtfsTrips = gtfsRoute?.trips;
    const osmTrips = osmRoute?.tripRelations;

    const [showTrips, setShowTrips] = useState<boolean>(false);

    const stopSequenceCmp = (t1: GTFSTripUnion, t2: GTFSTripUnion) => {
        const hs1 = t1.headSign;
        const hs2 = t2.headSign;

        if (hs1 === hs2) {
            return t2.stopSequence.length - t1.stopSequence.length
        }

        return hs1.localeCompare(hs2);
    };

    const onGTFSTripSelect = useCallback<(trip: GTFSTripUnion) => void>(gtfsTrip => {
        if (!setFilters || !filters) {
            return;
        }

        setFilters({
            ...filters,
            filterBy: [gtfsTrip]
        });
    }, [stopMatchData, filters, setFilters]);
    
    const onOSMTripSelect = useCallback<(trip: OSMRelation) => void>(osmTrip => {

        if (!setFilters || !filters) {
            return;
        }
        
        setFilters({
            ...filters,
            filterBy: [osmTrip]
        });
    }, [stopMatchData, setFilters]);

    const gtfsTripsElements = gtfsTrips?.sort(stopSequenceCmp)?.map(gtfsTrip => {
        return <GTFSTripDisplay key={gtfsTrip.sequenceId}
            gtfsTrip={gtfsTrip}
            onSelect={onGTFSTripSelect.bind(undefined, gtfsTrip)} />;
    });
    
    const osmTripsElements = osmTrips?.map(osmTrip => {
        return <OSMTripDisplay key={osmTrip.id}
            osmTrip={osmTrip}
            onSelect={onOSMTripSelect.bind(undefined, osmTrip)} />;
    });

    const osmMasterRelation = osmRoute?.masterRelation;

    return (<div className={'trips-info'}>
        <div className={'trips-info-header'}>
            {gtfsRoute && <span>GTFS Trips: {gtfsRoute?.trips?.length}</span>}
            {osmRoute && <span>OSM Trips: {osmRoute?.tripRelations?.length}</span>}
        </div>
        <div onClick={_e => setShowTrips(!showTrips)}>{showTrips ? 'hide trips' : 'show trips'}</div>
        {showTrips && <div className={'trips-h2'}>GTFS trips:</div>}
        {showTrips && gtfsRoute && gtfsTripsElements}
        {showTrips && <div className={'trips-h2'}>OSM trips:</div>}
        {showTrips && osmMasterRelation &&
            <div>OSM Master relation: {osmMasterRelation.tags.name}</div>
        }
        {showTrips && osmTripsElements}
    </div>);
}

type IMatchesFilter = {
    filters?: ListFiltersType
    setFilters?: (filters: ListFiltersType) => void
}

type ISelectable = {
    selected?: boolean
    onSelect?: () => void
}

type GTFSTripDisplayProps = {
    gtfsTrip: GTFSTripUnion
}
& ISelectable
function GTFSTripDisplay({gtfsTrip, selected, onSelect}: GTFSTripDisplayProps) {
    const stopSequence = gtfsTrip.stopSequence;
    
    const classes = classNames(
        'route-match-gtfs-trip',
        {selected, "selectable": onSelect !== undefined});

    return <div className={classes} onClick={onSelect}>
        { gtfsTrip.headSign && <span>{gtfsTrip.headSign}</span> }
        { gtfsTrip.headSign && <span>&#9;</span> }
        <span>{`(${stopSequence.length}) stops`}</span>
    </div>;
}

type OSMTripDisplayProps = {
    osmTrip: OSMRelation
}
& ISelectable
function OSMTripDisplay({osmTrip, selected, onSelect}: OSMTripDisplayProps) {

    const platforms = osmTrip?.members?.filter(m => m.role === 'platform' || m.role === 'stop_position');
    const roadSegments = osmTrip?.members?.filter(m => m.role !== 'platform' && m.type === 'way');

    const loadCB = () => {
        loadInJOSM([osmTrip], false, false, true);
    };

    const classes = classNames(
        'route-match-osm-trip',
        {selected, "selectable": onSelect !== undefined});

    return <div className={classNames('route-match-osm-trip')}>
        <span className={classes} onClick={onSelect}>
            <span>{ osmTrip.tags.name }</span>
            <span>&#9;</span>
            <span>{`(${platforms.length} stops, ${roadSegments.length} ways)`}</span>
        </span>
        <span>&#9;</span>
        <span onClick={loadCB}>Load in JOSM</span>
    </div>;
}

export type RoutesMatchFiltersProps = {
    filters: ListFiltersType
    setFilters: (filters: ListFiltersType) => any
}
export function RoutesMatchFilters({filters, setFilters}:RoutesMatchFiltersProps) {

    const activeFilters = filters.filterBy.map(filter => {
        console.log(filter);

        if(filter instanceof GTFSRoute) {
            return <div><span>GTFS Route: </span><span>{filter.shortName}</span></div>
        }
        else if (filter instanceof GTFSTripUnion) {
            return <div><span>GTFS Trip: </span><span>{filter.headSign}</span></div>
        }
        else if (filter instanceof OsmRoute) {
            return <div><span>OSM Route: </span><span>{filter.name}</span></div>
        }
        else if ((filter as OSMRelation).type === 'relation') {
            return <div><span>OSM Trip: </span><span>{(filter as OSMRelation).tags.name}</span></div>
        }
        return <div>Unknow filter</div>
    });

    const clearFilters = useCallback(() => {
        setFilters({
            ...filters,
            filterBy: []
        });
    }, [filters, setFilters]);

    return <div className='routes-filters'>
        { activeFilters.length > 0 && <div>Stops are filtered by</div>}
        {activeFilters}
        { activeFilters.length > 0 && <button onClick={clearFilters}>Clear filter</button>}
    </div>
}
