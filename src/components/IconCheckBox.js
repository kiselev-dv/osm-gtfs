import React, { useCallback } from 'react';
import classNames from 'classnames';

import './icon-check-box.css';

export default function IconCheckBox({icon, alt, className, checked, onChange}) {

    const cssClass = classNames('material-icons', 'icon-check-box', className, {checked: checked});

    const handleClick = useCallback(() => {
        onChange && onChange(checked === undefined ? undefined : !checked);
    }, [checked, onChange]);

    return <span onClick={handleClick} className={cssClass}>{ icon }</span>

}