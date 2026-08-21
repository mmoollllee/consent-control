import { ConsentControl } from './ConsentControl/index';
import { getConsentControlCookie, setConsentControlCookie, getConsentVersion, clearConsentControlCookie, deleteAllCookies, loadScript } from './lib/index'

import { ConsentMessage } from './ConsentMessage/index';

window.deleteAllCookies = deleteAllCookies
window.loadScript = loadScript
window.getConsentControlCookie = getConsentControlCookie
window.setConsentControlCookie = setConsentControlCookie
window.getConsentVersion = getConsentVersion
window.clearConsentControlCookie = clearConsentControlCookie
window.ConsentControl = ConsentControl
window.ConsentMessage = ConsentMessage

export { ConsentControl, loadScript, getConsentControlCookie, setConsentControlCookie, getConsentVersion, clearConsentControlCookie, ConsentMessage, deleteAllCookies };
