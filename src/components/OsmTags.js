
import React, { useCallback, useState } from 'react';

import OSMData from '../services/OSMData';

/**
 * @typedef {import('../services/OSMData').OSMElement} OSMElement
*/

/**
 * @typedef {object} OSMElementTagsProps
 * @property {OSMElement} osmElement
 * @property {OSMData} osmData
 */

import "OsmTags.css"
import classNames from 'classnames';

/**
 * @type {React.FC<OSMElementTagsProps>}
 */
export default function OSMElementTags({osmElement, osmData}) {
    const tags = osmElement?.tags;

    const [redraw, setRedraw] = useState({});

    const handleEdit = useCallback(newTags => {
        osmData.setElementTags(newTags, osmElement);
        setRedraw({});
    }, [tags, osmElement, setRedraw]);
    
    return <TagEditor tags={tags} onChange={handleEdit} ></TagEditor>
}


export function TagEditor({tags, onChange, protectedKeys, invalidKeys}) {
    
    const handleKeyEdit = (key, evnt) => {
        const entries = Object.entries(tags);

        let newKey = evnt.target.value;
        const value = tags[key];

        // TODO: allow for transient "wrong" tags 
        if (tags[newKey]) {
            newKey += ':';
        }
        
        const index = entries.findIndex(([k,v]) => k === key);
        entries.splice(index, 1, [newKey, value]);
        
        onChange(Object.fromEntries(entries));
    };
    
    // There is no reason to use useCallback
    // this function will be changed on every
    // re-render anyways
    const handleValueEdit = (key, evnt) => {
        const value = evnt.target.value;

        onChange({
            ...tags,
            [key]: value
        });
    };

    const handleAddTag = () => {
        const newKey = 'key'
        onChange({
            ...tags,
            [newKey]: 'value'
        });
    };

    const handleDelete = useCallback(tagKey => {
        const {[tagKey]: oldValue, ...newTags} = tags;
        onChange(newTags);
    }, [tags, onChange]);

    const rows = Object.entries(tags || {}).map(([key, value], i) => {
        const readonly = protectedKeys?.includes(key);
        const invalid = invalidKeys?.includes(key);
        return (
            <tr key={i}>
                <td className={'tag-actions'}>
                    {!readonly && <span 
                        onClick={handleDelete.bind(undefined, key)} 
                        className={'material-icons osm-tag-delete'}
                    >
                        remove_circle_outline
                    </span>}
                </td>

                <td className={classNames('osm-tag-key', {invalid, protected: readonly})}>
                    <input 
                        value={key} 
                        readOnly={readonly}
                        onChange={handleKeyEdit.bind(undefined, key)}/>
                </td>
                
                <td className={classNames('osm-tag-value', {invalid, protected: readonly})}>
                    <input 
                        value={value} 
                        readOnly={readonly}
                        onChange={handleValueEdit.bind(undefined, key)}/>
                </td>
            </tr>
        );
    });

    return (<>{
        tags && <table className={'osm-tags-table'}>
            <tbody>
                {rows}
                <tr key={'tag-actions'}>
                    <td className={'tag-actions'}>
                        <span className={'material-icons'} 
                            onClick={handleAddTag}>add_circle_outline</span>
                    </td>
                    <td></td>
                    <td></td>
                </tr>
            </tbody>
        </table>
    }</>);

}
