import React, {useCallback, useState} from 'react';

import 'help.css';

import mdHelpRefCode from '../help/HelpRefCode.md';
import mdHelpNameTemplate from '../help/HelpNameTemplate.md';

export function HelpRefCodeTag() {
    const [folded, setFolded] = useState(true);

    const toggleCallback = useCallback(() => {
        setFolded(!folded);
    }, [folded, setFolded]);

    return <div>
        <a onClick={toggleCallback}>{folded ? 'show help' : 'hide'}</a>
        { !folded && <div className={'help'} dangerouslySetInnerHTML={{ __html: mdHelpRefCode.html}}></div> }

    </div>

}

export function HelpNameTemplate() {
    const [folded, setFolded] = useState(true);

    const toggleCallback = useCallback(() => {
        setFolded(!folded);
    }, [folded, setFolded]);

    return <div>
        <a onClick={toggleCallback}>{folded ? 'show help' : 'hide'}</a>
        { !folded && <div className={'help'} dangerouslySetInnerHTML={{ __html: mdHelpNameTemplate.html}}></div> }

    </div>

}