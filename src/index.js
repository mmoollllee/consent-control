import { ConsentControl } from './ConsentControl/index';
import { getConsentControlCookie, deleteAllCookies, loadScript } from './lib/index'

import { ConsentMessage } from './ConsentMessage/index';

window.deleteAllCookies = deleteAllCookies
window.loadScript = loadScript
window.getConsentControlCookie = getConsentControlCookie
window.ConsentControl = ConsentControl
window.ConsentMessage = ConsentMessage

export { ConsentControl, loadScript, getConsentControlCookie, ConsentMessage, deleteAllCookies };
