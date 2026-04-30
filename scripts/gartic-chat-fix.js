// ==UserScript==
// @name         Gartic.io Blue Floating Chat GUI (Draggable + F8)
// @namespace    https://github.com/yusifmuradliroot
// @version      6.1
// @description  Centered, draggable floating chat GUI with blue theme. Controlled via F8 key.
// @author       Yusf (Yusif Muradli)
// @match        https://gartic.io/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

/**
 * 🛑 ETHICAL USE NOTICE
 *
 * This script is part of an open educational project:
 * 🔗 https://github.com/yusifmuradliroot/gartictools-openscript
 *
 * ❌ DO NOT use to gain unfair advantages, spam, or disrupt other players.
 * ❌ DO NOT automate gameplay or integrate into cheating tools.
 * ❌ DO NOT redistribute, rehost, or use in closed-source projects.
 *
 * ✅ Permitted: Studying code, learning WebSocket mechanics, personal analysis.
 * ✅ Encouraged: Understanding real-time web communication ethically.
 *
 * ⚠️ Misuse violates both game TOS and project ethics.
 * 💡 Remember: "This is about understanding, not breaking."
 *
 * © All rights reserved by Yusif Muradli (a.k.a. Yusf).
 * You must comply immediately if requested to remove or stop using this code.
 */

(function () {
    'use strict';

    const state = {
        userId: null,
        socket: null,
        guiCreated: false,
        isGuiOpen: true,
    };

    // 🎨 Inject styles — position/transform handled inline via JS
    function injectStyles() {
        if (document.getElementById('gartic-gui-style')) return;
        const css = `
            #gartic-chat-gui {
                z-index: 9999999;
                width: 320px;
                background: rgba(13, 17, 23, 0.95);
                border: 1px solid #30363d;
                border-radius: 12px;
                box-shadow: 0 8px 24px rgba(0,0,0,0.5), 0 0 15px rgba(56,139,253,0.3);
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
                color: #c9d1d9;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                backdrop-filter: blur(10px);
            }
            #gui-header {
                background: linear-gradient(90deg, #1f6feb 0%, #161b22 100%);
                padding: 12px 15px;
                cursor: move;
                user-select: none;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid #30363d;
            }
            #gui-title {
                font-size: 14px;
                font-weight: 600;
                color: white;
                letter-spacing: 0.5px;
            }
            #gui-close-btn {
                background: transparent;
                border: none;
                color: #8b949e;
                font-size: 20px;
                cursor: pointer;
                line-height: 1;
                transition: color 0.2s;
                padding: 0 2px;
            }
            #gui-close-btn:hover { color: #ff5252; }
            #gui-body {
                padding: 15px;
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            #chat-input {
                width: 100%;
                padding: 10px 12px;
                border: 1px solid #30363d;
                border-radius: 6px;
                background: #0d1117;
                color: white;
                outline: none;
                box-sizing: border-box;
                font-size: 13px;
                transition: border-color 0.2s;
            }
            #chat-input:focus {
                border-color: #58a6ff;
                box-shadow: 0 0 0 2px rgba(56,139,253,0.2);
            }
            #send-btn {
                width: 100%;
                padding: 10px;
                background: #238636;
                color: white;
                border: none;
                border-radius: 6px;
                font-weight: 600;
                cursor: pointer;
                font-size: 13px;
                transition: background 0.2s, transform 0.1s;
            }
            #send-btn:hover { background: #2ea043; }
            #send-btn:active { transform: scale(0.98); }
            #status {
                font-size: 11px;
                text-align: center;
                color: #8b949e;
                margin-top: 2px;
            }
        `;
        const style = document.createElement('style');
        style.id = 'gartic-gui-style';
        style.textContent = css;
        document.head.appendChild(style);
    }

    // 💬 Create the floating GUI
    function createGUI() {
        if (state.guiCreated) return;

        const oldGui = document.getElementById('gartic-chat-gui');
        if (oldGui) oldGui.remove();

        const gui = document.createElement('div');
        gui.id = 'gartic-chat-gui';

        // Set initial position: centered
        gui.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            transition: opacity 0.25s ease, visibility 0.25s ease;
            opacity: 1;
            visibility: visible;
        `;

        gui.innerHTML = `
            <div id="gui-header">
                <span id="gui-title">💬 Yusf Chat v6.1</span>
                <button id="gui-close-btn" title="Close (F8)">×</button>
            </div>
            <div id="gui-body">
                <input type="text" id="chat-input" placeholder="Type your message...">
                <button id="send-btn">SEND</button>
                <div id="status">Waiting for connection...</div>
            </div>
        `;

        document.body.appendChild(gui);

        document.getElementById('send-btn').onclick = sendMessage;
        document.getElementById('chat-input').onkeypress = (e) => {
            if (e.key === 'Enter') sendMessage();
        };
        document.getElementById('gui-close-btn').onclick = toggleGui;

        setupDragLogic(gui);

        state.guiCreated = true;
        console.log('%c💬 [GUI] Created', 'color: #58a6ff');
    }

    // 🖱️ Enable dragging on header
    function setupDragLogic(gui) {
        const header = document.getElementById('gui-header');

        header.addEventListener('mousedown', (e) => {
            if (e.target.id === 'gui-close-btn') return;
            e.preventDefault();

            const rect = gui.getBoundingClientRect();
            gui.style.transform = 'none';
            gui.style.transition = 'none';
            gui.style.left = rect.left + 'px';
            gui.style.top = rect.top + 'px';

            const startX = e.clientX - rect.left;
            const startY = e.clientY - rect.top;

            function onMouseMove(e) {
                let newLeft = e.clientX - startX;
                let newTop = e.clientY - startY;

                newLeft = Math.max(0, Math.min(window.innerWidth - gui.offsetWidth, newLeft));
                newTop = Math.max(0, Math.min(window.innerHeight - gui.offsetHeight, newTop));

                gui.style.left = newLeft + 'px';
                gui.style.top = newTop + 'px';
            }

            function onMouseUp() {
                gui.style.transition = 'opacity 0.25s ease, visibility 0.25s ease';
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            }

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    }

    // 👁️ Toggle GUI visibility
    window.toggleGui = function () {
        const gui = document.getElementById('gartic-chat-gui');
        if (!gui) return;

        state.isGuiOpen = !state.isGuiOpen;

        if (state.isGuiOpen) {
            gui.style.opacity = '1';
            gui.style.visibility = 'visible';
            gui.style.pointerEvents = 'auto';
            console.log('%c👁️ [GUI] Opened', 'color: #58a6ff');
        } else {
            gui.style.opacity = '0';
            gui.style.visibility = 'hidden';
            gui.style.pointerEvents = 'none';
            console.log('%c🙈 [GUI] Closed', 'color: #8b949e');
        }
    };

    // ⌨️ F8 Key Toggle
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F8') {
            e.preventDefault();
            toggleGui();
        }
    });

    // 📤 Send message through GUI
    function sendMessage() {
        const input = document.getElementById('chat-input');
        if (!input || !input.value.trim()) return;
        gchat(input.value.trim());
    }

    // 📣 Global chat function: gchat("your message")
    window.gchat = function (msg) {
        if (!msg) {
            console.warn('%c⚠️ [GCHAT] Usage: gchat("message")', 'color: #ff9800');
            return;
        }
        if (!state.userId || !state.socket || state.socket.readyState !== 1) {
            console.error('%c❌ [GCHAT] No active connection!', 'color: #ff5252');
            return;
        }
        try {
            state.socket.send(`42[11,${state.userId},"${msg}"]`);
            console.log(`%c📤 [GCHAT] "${msg}" sent`, 'color: #58a6ff; font-weight: bold');

            const input = document.getElementById('chat-input');
            if (input) input.value = '';

            const statusEl = document.getElementById('status');
            if (statusEl) {
                statusEl.textContent = '✅ Sent';
                statusEl.style.color = '#58a6ff';
                setTimeout(() => {
                    statusEl.textContent = 'Ready';
                    statusEl.style.color = '#8b949e';
                }, 1500);
            }
        } catch (e) {
            console.error('[GCHAT ERROR]', e);
        }
    };

    // 🔍 Hook WebSocket to capture user ID and connection
    const OriginalWebSocket = window.WebSocket;

    window.WebSocket = function (url, protocols) {
        const ws = protocols
            ? new OriginalWebSocket(url, protocols)
            : new OriginalWebSocket(url);

        console.log('%c🔗 [WS] ' + url, 'color: #58a6ff; font-weight: bold');
        state.socket = ws;

        const originalSend = ws.send.bind(ws);
        ws.send = function (data) {
            if (typeof data === 'string') console.log('%c📤 [OUT] ' + data, 'color: #ffaa00');
            return originalSend(data);
        };

        ws.addEventListener('message', (event) => {
            const data = event.data;
            if (typeof data !== 'string') return;
            console.log('%c📥 [IN] ' + data, 'color: #00ccff');

            // Extract User ID when login packet arrives
            if (!state.userId && data.startsWith('42["5",')) {
                try {
                    const parts = JSON.parse(data.slice(2));
                    state.userId = parts[2];
                    console.log(`%c⭐ [USER ID] ${state.userId}`, 'color: #bc8cff; font-weight: bold');

                    createGUI();

                    const statusEl = document.getElementById('status');
                    if (statusEl) {
                        statusEl.textContent = `✅ Ready (ID: ${state.userId})`;
                        statusEl.style.color = '#58a6ff';
                    }
                } catch (e) {
                    console.warn('[ID PARSE ERROR]', e);
                }
            }
        });

        ws.addEventListener('open', () => console.log('%c✅ [WS OPEN]', 'color: #58a6ff'));
        ws.addEventListener('close', () => console.log('%c❌ [WS CLOSE]', 'color: #ff5252'));
        ws.addEventListener('error', (e) => console.error('[WS ERROR]', e));

        return ws;
    };

    // Preserve static properties of WebSocket
    Object.setPrototypeOf(window.WebSocket, OriginalWebSocket);
    window.WebSocket.prototype = OriginalWebSocket.prototype;
    ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'].forEach(k => {
        window.WebSocket[k] = OriginalWebSocket[k];
    });

    // 🚀 Initialize
    injectStyles();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createGUI);
    } else {
        createGUI();
    }

    console.log('%c🚀 [HOOK ACTIVE] F8: open/close | gchat("message")', 'color: #58a6ff; font-weight: bold');
})();
