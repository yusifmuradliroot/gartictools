// ==UserScript==
// @name         Dynamic JS Injector & Updater
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Belirtilen URL'den JS dosyasını enjekte eder ve güncellemeleri kontrol eder.
// @author       Yusf
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @connect      *
// ==/UserScript==

(function() {
    'use strict';

    const RAW_SCRIPT_URL = "https://raw.githubusercontent.com/kullanici/proje/main/script.js";
    const UPDATE_CHECK_URL = "https://raw.githubusercontent.com/kullanici/proje/main/version.json";
    const CURRENT_VERSION = "1.0.0";

    function fetchUrl(url) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "GET",
                url: url,
                onload: function(response) {
                    if (response.status === 200) {
                        resolve(response.responseText);
                    } else {
                        reject(`HTTP Hatası: ${response.status}`);
                    }
                },
                onerror: function(err) {
                    reject("Bağlantı hatası");
                }
            });
        });
    }

    function injectScript(code) {
        try {
            const script = document.createElement('script');
            script.textContent = code;
            script.type = 'text/javascript';
            (document.head || document.documentElement).appendChild(script);
        } catch (e) {
            console.error("[DynamicInjector] Enjeksiyon hatası:", e);
        }
    }

    async function checkForUpdates() {
        if (!UPDATE_CHECK_URL) return;
        try {
            const data = await fetchUrl(UPDATE_CHECK_URL);
            const updateInfo = JSON.parse(data);
            if (updateInfo && updateInfo.version) {
                if (isNewerVersion(updateInfo.version, CURRENT_VERSION)) {
                    console.warn(`[DynamicInjector] Yeni sürüm mevcut: ${updateInfo.version}.`);
                    if (confirm(`Yeni güncelleme (${updateInfo.version}). Güncellemek ister misiniz?`)) {
                        window.open('https://www.tampermonkey.net/documentation.php#_updateURL', '_blank');
                    }
                }
            }
        } catch (e) {
            console.error("[DynamicInjector] Güncelleme kontrolü başarısız:", e);
        }
    }

    function isNewerVersion(newVer, oldVer) {
        const newParts = newVer.split('.').map(Number);
        const oldParts = oldVer.split('.').map(Number);
        for (let i = 0; i < Math.max(newParts.length, oldParts.length); i++) {
            const n = newParts[i] || 0;
            const o = oldParts[i] || 0;
            if (n > o) return true;
            if (n < o) return false;
        }
        return false;
    }

    async function main() {
        checkForUpdates();
        try {
            const scriptCode = await fetchUrl(RAW_SCRIPT_URL);
            injectScript(scriptCode);
        } catch (e) {
            console.error("[DynamicInjector] Ana script yüklenemedi:", e);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', main);
    } else {
        main();
    }

})();
