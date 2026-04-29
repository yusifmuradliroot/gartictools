// ==UserScript==
// @name         gartic-ws-analyzer
// @namespace    https://github.com/yusifmuradliroot/gartictools
// @version      2.1
// @description  Professional WebSocket traffic analyzer for Gartic.io (educational use only)
// @author       Yusf
// @match        https://gartic.io/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

/**
 * Gartic WebSocket Analyzer v2.1
 * 
 * This tool captures and displays WebSocket traffic between your browser and Gartic.io servers.
 * It is designed strictly for educational purposes to understand WebSocket communication patterns.
 * 
 * HOW IT WORKS:
 * - Intercepts WebSocket connections established by Gartic.io
 * - Logs all incoming and outgoing messages to browser console
 * - Provides simple packet injection capability for analysis
 * 
 * HOW TO USE:
 * 1. Install this script via Violentmonkey/Tampermonkey
 * 2. Open Gartic.io in your browser
 * 3. Open browser console (F12) to view captured traffic
 * 4. To send custom packets:
 *    • Use sendWS("packet_content") in console
 *    • Or set sendwspacket = "packet_content"
 * 
 * IMPORTANT:
 * • This is an educational tool - NOT for cheating or gaining unfair advantage
 * • Full documentation and terms: https://github.com/yusifmuradliroot/gartictools
 * • Report issues or questions at the GitHub repository
 * • Using this tool to disrupt gameplay violates its intended purpose
 * 
 * This tool is part of the Gartic Tools educational project.
 * It is designed strictly for protocol analysis and technical understanding.
 */

(function() {
    'use strict';

    let activeWS = null;

    const originalWS = window.WebSocket;
    window.WebSocket = class extends originalWS {
        constructor(url) {
            super(url);
            activeWS = this;
            console.log('%c[WS] ' + url, 'color:#aaaaaa');

            this.addEventListener('message', e => {
                const data = e.data;
                if (typeof data === 'string') {
                    console.log('%c[IN] ' + data, 'color:#cccccc');
                } else {
                    console.log('%c[IN] BINARY (size=' + (data?.size || data?.length || 0) + ')', 'color:#cccccc');
                }
            });

            const originalSend = this.send;
            this.send = function(data) {
                if (typeof data === 'string') {
                    console.log('%c[OUT] ' + data, 'color:#c0c0c0');
                } else {
                    console.log('%c[OUT] BINARY (size=' + (data?.size || data?.length || 0) + ')', 'color:#c0c0c0');
                }
                return originalSend.call(this, data);
            };
        }
    };

    /**
     * Send custom WebSocket packet to active connection
     * @param {string} packet - The packet content to send
     */
    window.sendWS = packet => {
        if (activeWS && activeWS.readyState === WebSocket.OPEN) {
            activeWS.send(packet);
        }
    };

    /**
     * Global variable for easy packet injection
     * Assign a value to automatically send it: sendwspacket = "42[...]";
     */
    Object.defineProperty(window, 'sendwspacket', {
        set: packet => window.sendWS(packet),
        configurable: true
    });

    // Initial notification
    console.log('%c[INFO] Gartic WebSocket Analyzer v2.1 active', 'color:#999999');
    console.log('%c[INFO] Documentation: https://github.com/yusifmuradliroot/gartictools', 'color:#999999');
    console.log('%c[INFO] Report issues at GitHub repository', 'color:#999999');
})();
