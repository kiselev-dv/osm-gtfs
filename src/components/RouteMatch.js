import React from "react";

import "./RouteMatch.css"

export default function RouteMatch({routeMatch}) {
    const {gtfsRoute, osmRoute} = routeMatch;

    const id = gtfsRoute?.id || osmRoute?.ref;

    const gtfsRouteTitle = gtfsRoute && (`${gtfsRoute?.shortName} - ${gtfsRoute?.longName}`);

    // const osmTrips = osmRoute?.tripRelations?.map(tripRelation => 
    //     <div key={tripRelation.id}><span>trip: </span>{tripRelation.tags.name}</div>
    // );

    return <>
    <div key={id} className={'route-match'}>
        {gtfsRouteTitle && <span>{ gtfsRouteTitle }</span>}
        {osmRoute && <span>{osmRoute?.name?.replace(id, '')}</span>}
    </div>
    <TripsData {...{gtfsRoute, osmRoute}} />
    </>
}

function TripsData({gtfsRoute, osmRoute}) {
    return (<div className={'trips-info'}>
        {gtfsRoute && <span>GTFS Trips: {gtfsRoute?.trips?.length}</span>}
        {osmRoute && <span>OSM Trips: {osmRoute?.tripRelations?.length}</span>}
    </div>);
}