"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metaAccessToken = void 0;
exports.sendConversionEvent = sendConversionEvent;
const crypto_1 = require("crypto");
const params_1 = require("firebase-functions/params");
exports.metaAccessToken = (0, params_1.defineSecret)('META_ACCESS_TOKEN');
const PIXEL_ID = '925361066071417';
const API_VERSION = 'v19.0';
function sha256(value) {
    return (0, crypto_1.createHash)('sha256').update(value.trim().toLowerCase()).digest('hex');
}
async function sendConversionEvent(eventName, customData, userData, eventId) {
    const token = exports.metaAccessToken.value();
    if (!token) {
        console.warn('META_ACCESS_TOKEN not set, skipping CAPI event:', eventName);
        return;
    }
    const hashedUserData = {};
    if (userData.em)
        hashedUserData.em = sha256(userData.em);
    if (userData.ph)
        hashedUserData.ph = sha256(userData.ph);
    if (userData.fn)
        hashedUserData.fn = sha256(userData.fn);
    if (userData.ln)
        hashedUserData.ln = sha256(userData.ln);
    if (userData.client_ip_address)
        hashedUserData.client_ip_address = userData.client_ip_address;
    if (userData.client_user_agent)
        hashedUserData.client_user_agent = userData.client_user_agent;
    const event = {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        action_source: 'website',
        user_data: hashedUserData,
        custom_data: customData,
    };
    try {
        const res = await fetch(`https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                data: [event],
                access_token: token,
            }),
        });
        if (!res.ok) {
            const body = await res.text();
            console.error('Meta CAPI error:', res.status, body);
        }
    }
    catch (err) {
        console.error('Meta CAPI request failed:', err);
    }
}
//# sourceMappingURL=meta-capi.js.map