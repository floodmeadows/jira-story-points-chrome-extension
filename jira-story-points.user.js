// ==UserScript==
// @name         Jira story points
// @namespace    https://openuserjs.org/users/floodmeadows
// @description  Adds buttons to quickly assign story points to the current issue.
// @copyright    2023, floodmeadows (https://openuserjs.org/users/floodmeadows)
// @license      MIT
// @version      0.2
// @include      https://jira.*.uk/browse/*
// @updateURL    https://openuserjs.org/meta/floodmeadows/Jira_story_points.meta.js
// @downloadURL  https://openuserjs.org/install/floodmeadows/Jira_story_points.user.js
// @grant        none
// ==/UserScript==

/* jshint esversion: 6 */

//--- Customise these to suit your needs ----//
const storyPointsFieldName = "Story Points";
const targetElementForStoryPointsButtonsRow = document.getElementById('issuedetails').lastElementChild;
//-------------------------------------------//

const debug = false;
var storyPointsFieldId = "";

(function () {
    'use strict';

    addStoryPointsButtonsIfStoryPointsFieldExistsInJira();
})();

function addButtons(elementToAdButtonsRowAfter) {
    const rowForSettingStoryPoints = elementToAdButtonsRowAfter.cloneNode(false); // false = just clone that node, not the whole node tree
    rowForSettingStoryPoints.setAttribute("id", "story-points-li");
    rowForSettingStoryPoints.innerHTML = `<div class="wrap"><strong class="name" title="Labels">
        <label>Set story points:</label>
    </strong>
    <div class="labels-wrap value">
        <span class="labels" id="story-points-buttons">
        </span>
    </div>
</div>`
    elementToAdButtonsRowAfter.after(rowForSettingStoryPoints);

    const storyPointsButtons = [
        {"text": "0", "points": 0},
        {"text": "1", "points": 1},
        {"text": "2", "points": 2},
        {"text": "3", "points": 3},
        {"text": "5", "points": 5},
        {"text": "8", "points": 8},
        {"text": "13", "points": 13}
    ];

    storyPointsButtons.forEach( function(button) {
        addButton(button.text, button.points)
    });

    const areStoryPointsCurrentlyShowingOnThePage = document.getElementById(storyPointsFieldId + '-val') !== null;
    if (areStoryPointsCurrentlyShowingOnThePage == true) {
        addButton("Remove points", null);
    };
}

function addButton(buttonText,storyPoints) {
    const newElement = document.createElement("button");
    newElement.setAttribute("class", "aui-button");
    newElement.addEventListener("click", function () { updateIssue(storyPoints); });
    const text = document.createTextNode(buttonText);
    newElement.appendChild(text);
    const target = document.getElementById('story-points-buttons');
    target.appendChild(newElement);
}

function updateIssue(newStoryPointsValue) {
    //--- Get standard info ---//
    const currentUrl = new URL(document.URL);
    const jiraBaseUrl = currentUrl.protocol + '//' + currentUrl.host;
    const currentIssueKey = document.getElementById("key-val").childNodes[0].nodeValue;
    const updateIssueUrl = `${jiraBaseUrl}/rest/api/latest/issue/${currentIssueKey}`;

    var headers = new Headers();
    headers.append("Content-Type", "application/json");

    var jsonToUpdateIssue = JSON.stringify({
        "fields": {
            "PLACEHOLDER_FOR_STORY_POINTS_FIELD_ID": newStoryPointsValue
        }
    });
    jsonToUpdateIssue = jsonToUpdateIssue.replace("PLACEHOLDER_FOR_STORY_POINTS_FIELD_ID", storyPointsFieldId);

    if (debug) console.log(jsonToUpdateIssue);

    var requestOptions = {
        method: 'PUT',
        headers: headers,
        body: jsonToUpdateIssue
    };

    fetch(updateIssueUrl, requestOptions)
        .then(response => {
            console.log(response.text());
            if(!debug) window.location.assign(currentUrl);
        })
        .catch(error => console.log('error', error));
}

function addStoryPointsButtonsIfStoryPointsFieldExistsInJira() {
    //--- Get standard info ---//
    const currentUrl = new URL(document.URL);
    const jiraBaseUrl = currentUrl.protocol + '//' + currentUrl.host;
    const currentIssueKey = document.getElementById("key-val").childNodes[0].nodeValue;
    const apiUrl = `${jiraBaseUrl}/rest/api/latest/field`;
    if(debug) console.log('URL: ' + apiUrl);

    var headers = new Headers();
    headers.append("Content-Type", "application/json");

    var requestOptions = {
        method: 'GET',
        headers: headers
    };

    fetch(apiUrl, requestOptions)
        .then(response => {
            const jsonPromise = response.json()
                .then(data => {
                    const fields = data;
                    if (debug) console.log(fields);
                    fields.forEach( function(field) {
                        if (debug) console.log(field.name);
                        if(field.name == storyPointsFieldName) {
                            storyPointsFieldId = field.id;
                            addButtons(targetElementForStoryPointsButtonsRow);
                        };
                    });
                });
            })
        .catch(error => {
            console.log('error', error);
            return false;
        })
}