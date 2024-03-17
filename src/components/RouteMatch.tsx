
import { GTFSRoute, GTFSTripUnion } from "../models/GTFSData";
import { OsmRoute } from "../models/OsmRoute";
import { RouteMatchType } from "../services/Matcher.types";
import "./RouteMatch.css";

type RouteMatchProps = {
    routeMatch: RouteMatchType
};
export default function RouteMatch({routeMatch}: RouteMatchProps) {
    const {gtfsRoute, osmRoute} = routeMatch;

    const id = gtfsRoute?.id || osmRoute?.ref;

    const gtfsRouteTitle = gtfsRoute && (`${gtfsRoute?.shortName} - ${gtfsRoute?.longName}`);

    return <>
    <div key={id} className={'route-match'}>
        {gtfsRouteTitle && <span>{ gtfsRouteTitle }</span>}
        {
        // @ts-ignore
        osmRoute && <span>{osmRoute?.name?.replace(id, '')}</span>
        }
    </div>
    <TripsData {...{gtfsRoute, osmRoute}} />
    </>
}

type TripsDataProps = {
    gtfsRoute?: GTFSRoute
    osmRoute?: OsmRoute
};
function TripsData({gtfsRoute, osmRoute}: TripsDataProps) {
    const gtfsTrips = gtfsRoute?.trips;

    const stopSequenceCmp = (t1: GTFSTripUnion, t2: GTFSTripUnion) => {
        const hs1 = t1.headSign;
        const hs2 = t2.headSign;

        if (hs1 === hs2) {
            return t2.stopSequence.length - t1.stopSequence.length
        }

        return hs1.localeCompare(hs2);
    };

    const gtfsTripsElements = gtfsTrips?.sort(stopSequenceCmp)?.map(gtfsTrip =>
        <GTFSTripDisplay gtfsTrip={gtfsTrip} key={gtfsTrip.sequenceId} />
    );

    return (<div className={'trips-info'}>
        <div className={'trips-info-header'}>
            {gtfsRoute && <span>GTFS Trips: {gtfsRoute?.trips?.length}</span>}
            {osmRoute && <span>OSM Trips: {osmRoute?.tripRelations?.length}</span>}
        </div>
        {gtfsRoute && gtfsTripsElements}
    </div>);
}

type GTFSTripDisplayProps = {
    gtfsTrip: GTFSTripUnion
}
function GTFSTripDisplay({gtfsTrip}: GTFSTripDisplayProps) {
    const stopSequence = gtfsTrip.stopSequence;

    return <div onClick={() => {console.log(gtfsTrip);}}>
        { gtfsTrip.headSign && <span>{gtfsTrip.headSign}</span>}
        { gtfsTrip.headSign && <span>&#9;</span> }
        <span>{`(${stopSequence.length}) stops`}</span>
    </div>;
}
