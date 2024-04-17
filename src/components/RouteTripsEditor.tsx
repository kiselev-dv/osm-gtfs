import { useState } from "react"
import { GTFSTripUnion } from "../models/GTFSData"
import { OsmRoute } from "../models/OsmRoute"
import { RouteMatchType } from "../services/Matcher.types"
import { OSMRelation } from "../services/OSMData.types"
import { getGTFSRouteName } from "./RouteMatch"

export type RouteTripsEditorContext = {
    routeMatch?: RouteMatchType
    gtfsTrip?: GTFSTripUnion
    osmTrip?: OsmRoute
}


export type IRouteTripsEditorState = {
    routeEditorSubj: RouteTripsEditorContext
    setRouteEditorSubj: (subj: RouteTripsEditorContext) => any
}

export type RouteTripsEditorProps = {
} & IRouteTripsEditorState

export default function RouteTripsEditor({
    routeEditorSubj, setRouteEditorSubj}: RouteTripsEditorProps) {

    const { routeMatch, gtfsTrip, osmTrip } = routeEditorSubj;

    const [osmTripHighlight, setOsmTripHighlight] = useState<OSMRelation>();

    const name = getGTFSRouteName(routeMatch?.gtfsRoute);

    const tripRelations = routeMatch?.osmRoute?.tripRelations;

    const osmTripOptions = tripRelations?.map(rel => {
        return <div onClick={setOsmTripHighlight.bind(undefined, rel)}>{rel.tags.name}</div>
    });

    const tags = osmTripHighlight && Object.entries(osmTripHighlight.tags).map(([k, v]) => {
        return <div><span>{k}</span><span> = </span><span>{v}</span></div>
    });

    return <>
        <div>
            {name}
            <div>
                <h5>OSM Route: {routeMatch?.osmRoute?.name}</h5>
                {tags}
            </div>
        </div>
        <div className={'scroll-pane'}>
            { osmTripOptions }
        </div>
    </>
}