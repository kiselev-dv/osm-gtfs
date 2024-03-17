import classNames from 'classnames';
import { useCallback } from 'react';

import './icon-check-box.css';

type checkedCB = (selected?: boolean) => void;

export type IconCheckBoxProps = {
    icon: string
    alt?: string
    className?: string
    checked?: boolean
    onChange?: checkedCB
};
export default function IconCheckBox(
    {icon, alt, className, checked, onChange}: IconCheckBoxProps
) {

    const cssClass = classNames('material-icons', 'icon-check-box', className, {checked: checked});

    const handleClick = useCallback(() => {
        onChange && onChange(checked === undefined ? undefined : !checked);
    }, [checked, onChange]);

    return <i aria-label={alt} onClick={handleClick} className={cssClass}>{ icon }</i>

}