
import React from 'react';

import OSMData from '../services/OSMData';

/**
 * @typedef {import('../services/OSMData').OSMElement} OSMElement
*/

/**
 * @typedef {object} OSMElementTagsProps
 * @property {OSMElement} osmElement
 * @property {OSMData} osmData
 */

/**
 * @type {React.FC<OSMElementTagsProps>}
 */
export default function OSMElementTags({osmElement , osmData}) {
    const tags = osmElement?.tags;

    const rows = Object.entries(tags || {}).map(([key, value], i) => {
        return (
            <tr key={i}>
                <td className={'osm-tag-key'}>{key}</td>
                <td className={'osm-tag-value'}><input readOnly={true} value={value}></input></td>
            </tr>
        );
    });

    return (<>{
        tags && <table className={'osm-tags-table'}>
            <tbody>{rows}</tbody>
        </table>
    }</>);
    
}
