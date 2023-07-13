import React from 'react';
import classNames from 'classnames';

import { getMatchColor } from './MapMatchMarker';

export default function StopListElement({match, selected, onClick}) {
    const osmStop = match.osmStop;
    const gtfsStop = match.gtfsStop;

    const name = osmStop?.getName() || gtfsStop?.name || osmStop?.getId();
    const className = classNames(
        'stop-match', {
            'matched': !!osmStop && !!gtfsStop,
            'selected': selected
        }
    );

    const color = getMatchColor(match);

    return (<div {...{onClick}} className={className}>
        <span style={{backgroundColor: color}} className={'match-mark'}>&nbsp;</span>{ name }
    </div>);
}