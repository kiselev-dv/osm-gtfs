import classNames from 'classnames';

import { StopMatch } from '../services/Matcher.types';
import { getMatchColor } from './MapMatchMarker';

export type StopListElementProps = {
    match: StopMatch
    selected: boolean
    onClick: (evnt: React.MouseEvent<HTMLDivElement>) => void
};
export default function StopListElement({match, selected, onClick}: StopListElementProps) {
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