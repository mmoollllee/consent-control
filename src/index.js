import { ConsentControl } from './ConsentControl/index';
import { loadScript } from './lib/loadScript'
import { getConsentControlCookie } from './lib/cookie.js'

import { ConsentMessage } from './ConsentMessage/index';

window.loadScript = loadScript
window.getConsentControlCookie = getConsentControlCookie
window.ConsentControl = ConsentControl
window.ConsentMessage = ConsentMessage

export { ConsentControl, loadScript, getConsentControlCookie, ConsentMessage };
