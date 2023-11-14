import React from 'react';

import { HelpRefCodeTag } from './HelpMarkdown';
import "./MatchSettings.css";

export default function MatchSettings({ matchSettings, setMatchSettings }) {
    const { refTag, matchByName, matchByCodeInName } = matchSettings;
    
    const setTag = value => {
        setMatchSettings({
            ...matchSettings,
            refTag: value,
        });
    };

    const setMatchByName = value => {
        setMatchSettings({
            ...matchSettings,
            matchByName: value
        });
    }

    const setMatchByCodeInName = value => {
        setMatchSettings({
            ...matchSettings,
            matchByCodeInName: value
        });
    }
    
    // const setNameTemplate = value => {
    //     setMatchSettings({
    //         ...matchSettings,
    //         nameTemplate: value,
    //     });
    // };

    return <div className={"match-settings"}>
        <div>
            <span>OSM Tag with GTFS stop code: </span>
            <span>
                <input value={refTag} onChange={e => setTag(e.target.value)}></input>
            </span>
        </div>
        <HelpRefCodeTag></HelpRefCodeTag>
        <div>
            <span>Match stops by name: </span>
            <span>
                <input type={'checkbox'} checked={matchByName} 
                    onChange={e => setMatchByName(e.target.checked)}></input>
            </span>
        </div>
        <div>
            <span>Match stops by GTFS code in name: </span>
            <span>
                <input type={'checkbox'} checked={matchByCodeInName} 
                    onChange={e => setMatchByCodeInName(e.target.checked)}></input>
            </span>
        </div>

        {/* <HelpNameTemplate></HelpNameTemplate>
        <div>
            <span>Name template: </span>
            <span>
                <input value={nameTemplate} onChange={e => setNameTemplate(e.target.value)}></input>
            </span>
        </div>  */}

    </div> 
}

export function matchSettingsMatch(settingsA, settingsB) {
    if (settingsA && settingsB) {
        return settingsA.refTag === settingsB.refTag &&
                settingsA.matchByName === settingsB.matchByName &&
                settingsA.matchByCodeInName === settingsB.matchByCodeInName
    }
    return false;
}