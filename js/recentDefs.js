// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file. -> https://creativecommons.org/licenses/by/3.0/
// Original file : https://developer.chrome.com/extensions/examples/api/history/showHistory/typedUrls.js
// MODIFIED by Sarah Marsh


// Event listner for clicks on the learn button for each word
function clickOpenTab(id) {
    chrome.storage.sync.get('urls',  function(items) {
        if(chrome.runtime.lastError) {
        } else {
            urls = items['urls'];
            chrome.tabs.create({
                selected: true,
                url: urls[id]
            });
        }
    });
  return false;
}

//Check if our parent has no elements, or we haven't searched anything recently
function checkEmpty(mainDiv){
    var numElements = mainDiv.getElementsByTagName("div").length;
    if (!numElements){
        var par = document.createElement('p');
        var message = document.createElement('i');
        message.appendChild(document.createTextNode('No recently searched definitions.'))
        par.appendChild(message)
        mainDiv.appendChild(par)
    }
}

var urls = {};
//Event listener for clicks on the remove button
function clickRemoveHist(id, element) {
    console.log(id);
    chrome.storage.sync.get('urls',  function(items) {
        if(chrome.runtime.lastError) {
        } else {
            urls = items['urls'];
            delete urls[id];
        }
        console.log(urls);
        chrome.storage.sync.set({'urls': urls}, function(){
            var row = element.parentNode;
            var parent = row.parentNode
            parent.removeChild(row);
            checkEmpty(parent);
        });
    });
    return false;
}

//Make a circle button
function make_button(icon, link, btn_type, name){
    var btn = document.createElement('button');
    btn.type = "button";
    btn.className = 'btn btn-'.concat(btn_type,' btn-circle inline pull-left');
    var btn_span = document.createElement('span');
    btn_span.className = icon;
    btn.appendChild(btn_span);
    btn.setAttribute("role","button");
    btn.id = name;
    return btn;
}

function eventHistFunc(t, element) {
    return function() { clickRemoveHist(t, element) };
}

function eventTabFunc(t) {
    return function() { clickOpenTab(t) };
}

// Given an array of URLs, build a DOM of buttons and links
// Displays words looked up in chrome in the last week
// Gives option to delete from history, view definition, or save
function buildPopupDom(divName, titles) {
    var popupDiv = document.getElementById(divName);
    for (var title in titles) {

        var word = document.createElement('span');
        word.className = "inline";
        word.appendChild(document.createTextNode(title));

        var remove = make_button("glyphicon glyphicon-remove", titles[title], 'warning', title);
        var learn = make_button("glyphicon glyphicon-education", titles[title], 'info', title);
        learn.addEventListener('click', eventTabFunc(title));
        remove.addEventListener('click', eventHistFunc(title, remove));

        var row = document.createElement("div");
        row.className = "clearfix";

        row.appendChild(remove);
        row.appendChild(learn);
        row.appendChild(word);
        popupDiv.appendChild(row);

    }
    checkEmpty(popupDiv);
}

function buildUrlList(time, divName, urls) {
    console.log(divName);
    console.log(time);
    if (typeof urls == 'undefined') {
        urls = {}
    }
    console.log(urls);
    chrome.history.search({
        'text': 'google.com.*q=define', // get google searches for word definitions
        'startTime': time 
    },
    function(historyItems) {
        // For each history item, find if it was a user defining a word
        for (var i = 0; i < historyItems.length; ++i) {
            var url = historyItems[i].url;

            var decode_url = decodeURI(url).replace('+', ' ');
            var decode_url = decode_url.replace('%3A', ' ');

            var myRe = /google.com.*q=define+([A-Za-z\s]+)/g;
            var match = myRe.exec(decode_url);
            if (!match){
                continue;
            }
            var title = match[1].trim();
            if(!urls[title]){
                urls[title] = url;
            }
        }
        chrome.storage.sync.set({'urls': urls}, function() {});
        buildPopupDom(divName, urls);
    });
}

function getUrls(time, divName, cb) {
    chrome.storage.sync.get('urls',  function(items) {
        if(chrome.runtime.lastError) {
            cb(time, divName, {});
        } else {
            cb(time, divName, items['urls']);
        }
    });
}

function getTimeStamp(cb) {
    chrome.storage.sync.get('timestamp',  function(items) {
        var microsecondsPerWeek = 1000 * 60 * 60 * 24 * 7;
        var currentTime = (new Date).getTime();
        var oneWeekAgo = currentTime - microsecondsPerWeek;
        if(chrome.runtime.lastError) {
            cb(oneWeekago);
        } else {
            cb(items['timestamp']);
        }
    });
}

// Search history to find up to find the words user has looked up in the past week
// Looks for "define <word>"
function buildTypedUrlList(divName) {
  // To look for history items visited in the last week,
  // subtract a week of microseconds from the current time.
    var lastTime = 0;
    getTimeStamp(function(t) { 
        getUrls(t, divName, buildUrlList); 
    });
    chrome.storage.sync.set({'timestamp': (new Date).getTime()}, function () {});
}

document.addEventListener('DOMContentLoaded', function () {
  buildTypedUrlList("typedUrl_div");
});
