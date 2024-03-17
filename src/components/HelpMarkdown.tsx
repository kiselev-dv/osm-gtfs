import { useCallback, useState } from 'react';

import './help.css';

export function HelpRefCodeTag() {
    const [folded, setFolded] = useState(true);

    const toggleCallback = useCallback(() => {
        setFolded(!folded);
    }, [folded, setFolded]);

    return <div>
        <a onClick={toggleCallback}>{folded ? 'show help' : 'hide'}</a>
        { !folded && <div className={'help'} >
            First step is to match stops from GTFS with stops in OSM.

            I count stop matched if OSM version has GTFS stop
            code or id in it's tags. There is no particular
            tag which would fit in all situations,
            so this tag is configurable.

            Some examples:
            <ul>
                <li><code>ref</code></li>
                <li><code>gtfs:ref</code></li>
                <li><code>&lt;operator_name&gt;:ref</code></li>
            </ul>

            After OSM data query is loaded, you can
            find OSM tags statisc for tags containing
            <code>ref</code> or <code>gtfs</code> above.
        </div> }
    </div>

}

export function HelpNameTemplate() {
    const [folded, setFolded] = useState(true);

    const toggleCallback = useCallback(() => {
        setFolded(!folded);
    }, [folded, setFolded]);

    return <div>
        <a onClick={toggleCallback}>{folded ? 'show help' : 'hide'}</a>
        { !folded && <div className={'help'} >
            For matched stops, it might be usefull to edit
            names accordingly to a common pattern.

            You can use a template to edit stop names:

            Use <code>$name</code>, <code>$code</code>, <code>$id</code>, <code>$description</code>
            to substitute corresponding GTFS values.

            You can apply regexp replace patterns to substituted values:
            <code>$name.re('&lt;search_expression&gt;', '&lt;replace_expression&gt;')</code>

            For instance if you want to remove text in brackets from
            <code>$name</code> use <code>$name.re('(.*)', '')</code>
        </div> }

    </div>

}