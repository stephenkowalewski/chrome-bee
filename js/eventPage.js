/* jshint esversion: 6 */
/**
 * Event Page (new kind of background page)
 *
 * Copyright © 2014-2020 Ruslan Osmanov <rrosmanov@gmail.com>
 */
'use strict';

let BeeUrlPattern = null;
let Storage = {};

(async function () {
  const module = await import('/js/storage.js');
  Storage = module;
  console.log(Storage)
})();

(async function () {
  const module = await import('/js/pattern.js');
  BeeUrlPattern = module.BeeUrlPattern;
})();

let port = null
const HOST_NAME = 'com.ruslan_osmanov.bee'
const RE_ARGS = /("[^"\\]*(?:\\[\S\s][^"\\]*)*"|'[^'\\]*(?:\\[\S\s][^'\\]*)*'|\/[^\/\\]*(?:\\[\S\s][^\/\\]*)*\/[gimy]*(?=\s|$)|(?:\\\s|\S)+)/
const RE_SPACES_ONLY = /^\s*$/
const RE_TRIM_QUOTES = /^\s*"|"*\s*$/g

function onDisconnected() {
  port = null
  console.log('onDisconnected', arguments, arguments[0].error)
}

function onNativeMessage(message) {
  if (typeof message.text === 'undefined') {
    return
  }

  message.bee_editor_output = 1
  chrome.tabs.query(
    {},
    (tabs) => {
      for (let i = 0; i < tabs.length; ++i) {
        chrome.tabs.sendMessage(tabs[i].id, message)
      }
    }
  )
}

function connect() {
  port = chrome.runtime.connectNative(HOST_NAME)
  port.onMessage.addListener(onNativeMessage)
  port.onDisconnect.addListener(onDisconnected)
}

/**
 * @param {string} url
 * @param {string|undefined} urlPatternsJson
 * @return {string}
 */
function getFilenameExtension(url, urlPatternsJson) {
  let extension = ''

  if (url === '') {
    return extension
  }

  if (urlPatternsJson === undefined) {
    return extension
  }

  const rawUrlPatterns = JSON.parse(urlPatternsJson) || []
  if (!Array.isArray(rawUrlPatterns)) {
    return extension
  }
  const urlPatterns = rawUrlPatterns.map((object) => BeeUrlPattern.fromObject(object))

  for (let pattern of urlPatterns) {
    const re = new RegExp(pattern.getRegex())
    if (re.test(url)) {
      extension = pattern.getExtension()
    }
  }
  return extension
}

chrome.commands.onCommand.addListener((command) => {
  if (command === 'bee-editor') {
    chrome.tabs.executeScript({
      file: "/js/content.js"
    })
  }
})

/* jshint unused:false*/
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.method === 'input') {
    let requestEditor = request.bee_editor || ""
    let args = requestEditor
      .split(RE_ARGS)
      .reduce((a, v) => {
        if (!RE_SPACES_ONLY.test(v)) {
          a.push(v.replace(RE_TRIM_QUOTES, ''))
        }
        return a
      }, [])
    let editor = args.length ? args.shift() : ''

    const ext = request.ext || ''

    connect()

    port.postMessage({
      editor: editor,
      args: args,
      ext: ext,
      text: request.bee_input
    })
  } else if (request.method === 'bee_editor') {
      Storage.getOptionValues([Storage.EDITOR_KEY, Storage.URL_PATTERNS_KEY], (values) => {
          sendResponse({
              bee_editor: values[Storage.EDITOR_KEY],
              ext: getFilenameExtension(request.url, values[Storage.URL_PATTERNS_KEY])
          })
      })
  }
})
