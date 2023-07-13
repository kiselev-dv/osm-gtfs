import React, { useCallback, useEffect, useState } from 'react';
import { GTFSRoute, GTFSTripUnion } from '../models/GTFSData';
import StopListElement from './StopListElement';

import './match-list.css';

export default function MatchList({
    matchData, gtfsData, 
    filteredMatches, setFilteredMatches, 
    selectedMatch, selectMatch}) {
    
    const [filters, setFilters] = useState({
        showMatched: true,
        showUnmatchedGtfs: true,
        showUnmatchedOsm: true,
        filterBy: []
    });

    // TODO: move to FilterCheckbox
    const filterChangeHandler = useCallback(event => {
        const key = event.target.getAttribute('data-key');
        const value = !filters[key];
        setFilters({
            ...filters,
            [key]: value
        });
    }, [filters, setFilters]);

    useEffect(() => {
        if (matchData) {
            const filtered = filterMatches(matchData, filters);
            setFilteredMatches(filtered);
        }
    }, [filters, matchData, setFilteredMatches]);

    const openListInJOSM = useCallback(() => {
        if (filteredMatches) {
            const osmElements = [];

            filteredMatches.forEach(m => {
                m.osmStop?.stopPosition && osmElements.push(m.osmStop?.stopPosition);
                m.osmStop?.platform && osmElements.push(m.osmStop?.platform);
            });

            loadInJOSM(osmElements);
        }

    }, [filteredMatches]);

    const stops = filteredMatches?.map(match => {
        const key = match.gtfsStop?.id || match.osmStop?.getId();
        const selected = selectedMatch === match;
        return <StopListElement 
            key={key} match={match} 
            selected={selected} 
            onClick={() => {console.log('selectMatch', match); selectMatch(match)}}>
        </StopListElement>
    });

    return (<div className={'match-list'}>
        <div className={'match-list-filters'}>
            <RouteStopsFilter 
                gtfsData={gtfsData} 
                filters={filters} 
                setFilters={setFilters}
            />
            <div>
                <FilterCheckbox 
                    label={'Show matched:'} 
                    filterKey={'showMatched'}
                    onChange={filterChangeHandler}
                    filters={filters}
                />
            </div>
            <div>
                <FilterCheckbox 
                    label={'Show unmatched GTFS:'} 
                    filterKey={'showUnmatchedGtfs'}
                    onChange={filterChangeHandler}
                    filters={filters}
                />
            </div>
            <div>
                <FilterCheckbox 
                    label={'Show unmatched OSM:'} 
                    filterKey={'showUnmatchedOsm'}
                    onChange={filterChangeHandler}
                    filters={filters}
                />
            </div>
            <div>
                <button onClick={openListInJOSM}>Open in JOSM</button>
            </div>
        </div>
        <div className={'scroll-pane'}>
            { stops }
        </div>
    </div>);

}

function FilterCheckbox({filterKey, label, filters, onChange}) {
    return <>
        <label>{label}</label>
        <input 
            type={'checkbox'} 
            data-key={filterKey} 
            onChange={onChange}
            checked={filters[filterKey]} 
        ></input>
    </>
}

function RouteStopsFilter({gtfsData, filters, setFilters}) {

    const options = gtfsData && Object.values(gtfsData.routes).map(route => {
        const routeKey = `r${route.id}`;
        
        const routeOption = 
            <option key={routeKey} value={routeKey}>
                {route.shortName}
            </option>;

        const tripOptions = route.trips.map((trip, i) => {
            const tripKey = `r${route.id} t${i}`;
            return <option key={tripKey} value={tripKey}>{trip.headSign}</option>
        });

        return [routeOption, ...tripOptions];
    });

    const selectionChange = useCallback((evnt) => {
        const key = evnt.target.value;
        const routeOrTrip = decodeSelectKey(gtfsData, key);

        setFilters({
            ...filters,
            filterBy: routeOrTrip ? [routeOrTrip] : []
        });
    }, [filters, setFilters, gtfsData]);

    return <div>
        <label>Filter matches by Route/Trip</label>
        <select disabled={!gtfsData} onChange={selectionChange}>
            <option key={'none'} value={'none'} >Select a route</option>
            { options }
        </select>
    </div>
}

function decodeSelectKey(gtfsData, key) {
    if (key === 'none') {
        return undefined;
    }

    
    const tripMatch = key.match(/r(.*?) t([\d]+)/);
    if (tripMatch) {
        const routeId = tripMatch[1];
        const tripIndex = tripMatch[2];

        const route = gtfsData.routes[routeId]
        if (route) {
            return route.trips[tripIndex];
        }
    }

    const routeMatch = key.match(/r(.*)/);
    if (routeMatch) {
        const routeId = routeMatch[1];
        return gtfsData.routes[routeId];
    }
}

function filterMatches(matchData, filters) {
    const {
        showMatched,
        showUnmatchedGtfs,
        showUnmatchedOsm,

        filterBy
    } = filters;

    if (filterBy && filterBy.length > 0) {
        const tripStopsIds = new Set();
        const filterByTrips = [];

        filterBy.forEach(filter => {
            if (filter instanceof GTFSRoute) {
                filterByTrips.push(...filter.trips); 
            }
            else if (filter instanceof GTFSTripUnion) {
                filterByTrips.push(filter);
            }
        });
        
        filterByTrips.forEach(trip => {
            trip.stopSequence.forEach(stop => {
                tripStopsIds.add(stop.id);
            });
        });

        return [...matchData.matched, ...matchData.unmatchedGtfs]
            .filter(match => tripStopsIds.has(match.gtfsStop.id));
    }

    const results = [];

    showMatched && results.push(...matchData.matched);
    showUnmatchedGtfs && results.push(...matchData.unmatchedGtfs);
    showUnmatchedOsm && results.push(...matchData.unmatchedOsm);

    return results;
}