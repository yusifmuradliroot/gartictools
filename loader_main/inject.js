(function() {
    'use strict';

    if (window.__wsSnifferActive) return;
    window.__wsSnifferActive = true;

    const OriginalWebSocket = window.WebSocket;

    window.WebSocket = function(url, protocols) {
        const wsInstance = new OriginalWebSocket(url, protocols);

        const originalSend = wsInstance.send;
        wsInstance.send = function(data) {
            console.group("%c📤 Giden Veri", "color: #FF9800;");
            console.log("Zaman:", new Date().toLocaleTimeString());
            if (typeof data === 'string') {
                try {
                    console.log("Tip: JSON", JSON.parse(data));
                } catch (e) {
                    console.log("Tip: Text", data);
                }
            } else {
                console.log("Tip: Binary", data);
            }
            console.groupEnd();
            return originalSend.apply(this, arguments);
        };

        const originalAddEventListener = wsInstance.addEventListener;
        wsInstance.addEventListener = function(type, listener, options) {
            if (type === 'message') {
                const wrappedListener = function(event) {
                    console.group("%c📥 Gelen Veri", "color: #4CAF50;");
                    console.log("Zaman:", new Date().toLocaleTimeString());
                    const data = event.data;
                    if (typeof data === 'string') {
                        try {
                            console.log("Tip: JSON", JSON.parse(data));
                        } catch (e) {
                            console.log("Tip: Text", data);
                        }
                    } else {
                        console.log("Tip: Binary", data);
                    }
                    console.groupEnd();
                    listener.call(this, event);
                };
                return originalAddEventListener.call(this, type, wrappedListener, options);
            }
            return originalAddEventListener.call(this, type, listener, options);
        };

        return wsInstance;
    };

    window.WebSocket.prototype = OriginalWebSocket.prototype;
    window.WebSocket.CONNECTING = OriginalWebSocket.CONNECTING;
    window.WebSocket.OPEN = OriginalWebSocket.OPEN;
    window.WebSocket.CLOSING = OriginalWebSocket.CLOSING;
    window.WebSocket.CLOSED = OriginalWebSocket.CLOSED;

})();
