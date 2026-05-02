// ==UserScript==
// @name         Dynamic JS Injector & Updater (Fixed)
// @namespace    http://tampermonkey.net/
// @version      1.0.1
// @description  Injects a remote JS file using GM_addElement to bypass CSP issues.
// @author       Yusf
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_addElement
// @grant        GM_getValue
// @grant        GM_setValue
// @connect      *
// ==/UserScript==

(function() {
    'use strict';

    // ================= CONFIGURATION =================
    // URL of the RAW JavaScript file (NO UserScript headers inside this file!)
    const RAW_SCRIPT_URL = "https://raw.githubusercontent.com/yusifmuradliroot/gartictools-openscript_reconstruction/refs/heads/main/loader_main/inject.js";
    
    // URL for version check (JSON format: {"version": "1.0.1"})
    // Leave empty "" if you don't have a version.json yet
    const UPDATE_CHECK_URL = ""; 
    
    const CURRENT_VERSION = "1.0.1";
    // =================================================

    console.log("[DynamicInjector] Initialized.");

    function fetchUrl(url) {
        return new Promise((resolve, reject) => {
            console.log(`[DynamicInjector] Fetching: ${url}`);
            GM_xmlhttpRequest({
                method: "GET",
                url: url,
                onload: function(response) {
                    if (response.status === 200) {
                        console.log(`[DynamicInjector] Fetched successfully.`);
                        resolve(response.responseText);
                    } else {
                        console.error(`[DynamicInjector] HTTP Error: ${response.status}`);
                        reject(`HTTP Error: ${response.status}`);
                    }
                },
                onerror: function(err) {
                    console.error(`[DynamicInjector] Network Error`, err);
                    reject("Network error");
                }
            });
        });
    }

    function injectScript(code) {
        try {
            console.log("[DynamicInjector] Injecting script via GM_addElement...");
            // GM_addElement is safer against CSP than document.createElement
            GM_addElement('script', {
                textContent: code,
                type: 'text/javascript'
            });
            console.log("[DynamicInjector] Injection successful.");
        } catch (e) {
            console.error("[DynamicInjector] Injection failed:", e);
        }
    }

    async function checkForUpdates() {
        if (!UPDATE_CHECK_URL) return;
        try {
            const data = await fetchUrl(UPDATE_CHECK_URL);
            let updateInfo;
            try {
                updateInfo = JSON.parse(data);
            } catch (e) {
                console.error("[DynamicInjector] Invalid JSON in update URL");
                return;
            }

            if (updateInfo && updateInfo.version) {
                if (isNewerVersion(updateInfo.version, CURRENT_VERSION)) {
                    console.warn(`[DynamicInjector] Update available: ${updateInfo.version}`);
                    if (confirm(`New version (${updateInfo.version}) available. Update now?`)) {
                        window.open('https://www.tampermonkey.net/documentation.php#_updateURL', '_blank');
                    }
                }
            }
        } catch (e) {
            console.error("[DynamicInjector] Update check failed:", e);
        }
    }

    function isNewerVersion(newVer, oldVer) {
        const n = newVer.split('.').map(Number);
        const o = oldVer.split('.').map(Number);
        for (let i = 0; i < Math.max(n.length, o.length); i++) {
            if ((n[i] || 0) > (o[i] || 0)) return true;
            if ((n[i] || 0) < (o[i] || 0)) return false;
        }
        return false;
    }

    async function main() {
        checkForUpdates();
        try {
            const scriptCode = await fetchUrl(RAW_SCRIPT_URL);
            if (scriptCode) {
                injectScript(scriptCode);
            }
        } catch (e) {
            console.error("[DynamicInjector] Main process failed:", e);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', main);
    } else {
        main();
    }

})();
