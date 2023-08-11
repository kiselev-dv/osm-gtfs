import React from "react";

import "./RouteMatch.css"

export default function RouteMatch({routeMatch}) {
    const {gtfsRoute, osmRoute} = routeMatch;

    const id = gtfsRoute?.id || osmRoute?.ref;

    // const osmTrips = osmRoute?.tripRelations?.map(tripRelation => 
    //     <div key={tripRelation.id}><span>trip: </span>{tripRelation.tags.name}</div>
    // );

    return <>
    <div key={id}>
        <span>{ id }</span>
        <span>&nbsp;</span>
        {osmRoute && <span>{osmRoute?.name?.replace(id, '')}</span>}
    </div>
    <TripsData {...{gtfsRoute, osmRoute}} />
    </>
}

function TripsData({gtfsRoute, osmRoute}) {
    return (<div className={'trips-info'}>
        {gtfsRoute && <span>GTFS Trips: </span>}
        <span>{gtfsRoute?.trips?.length}</span>
        {(gtfsRoute && osmRoute) && <span>&nbsp;</span>}
        {osmRoute && <span>OSM Trips: </span>}
        <span>{osmRoute?.tripRelations?.length}</span>
    </div>);
}