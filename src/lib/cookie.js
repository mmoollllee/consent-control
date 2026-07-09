/**
 * Resolve the configured cookie name. Prefers `ConsentControl.options.cookieName`
 * (set via ConsentControl.init), with a legacy fallback and the `consentcontrol`
 * default. Keeps the cookie name consistent across the npm / Laravel / Filament layers.
 */
const resolveCookieName = () =>
   (window.ConsentControl && window.ConsentControl.cookieName)
   || (window.ConsentControl && window.ConsentControl.options && window.ConsentControl.options.cookieName)
   || 'consentcontrol'

const cookieOpts = () => (window.ConsentControl && window.ConsentControl.options) || {}

/**
 * Write a cookie honouring the options provided via ConsentControl.init()
 * (cookieDays, cookieDomain, cookiePath, cookieSameSite, cookieSecure).
 */
const writeCookie = (name, value) => {
   const opts = cookieOpts()
   const exdays = opts.cookieDays || 365
   const domain = opts.cookieDomain || window.location.hostname
   const path = opts.cookiePath || '/'
   const sameSite = opts.cookieSameSite || 'lax'

   const d = new Date()
   d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000)

   let cookie = name + '=' + value
      + ';expires=' + d.toUTCString()
      + ';path=' + path
      + ';samesite=' + sameSite
      + ';domain=' + domain
   if (opts.cookieSecure) {
      cookie += ';secure'
   }
   document.cookie = cookie
}

const readRawCookie = (name) => {
   const prefix = name + '='
   const ca = document.cookie.split(';')
   for (let i = 0; i < ca.length; i++) {
      let c = ca[i]
      while (c.charAt(0) === ' ') {
         c = c.substring(1)
      }
      if (c.indexOf(prefix) === 0) {
         return c.substring(prefix.length)
      }
   }
   return null
}

/**
 * Save the granted consent categories to the cookie. Also writes a companion
 * version cookie ({name}-v) when `options.version` is set, so a later version
 * bump can force a fresh opt-in.
 * @param {String | Array} cvalue
 */
export const setConsentControlCookie = (cvalue, cookieName = resolveCookieName()) => {
   cvalue = Array.isArray(cvalue) ? cvalue : [cvalue]

   writeCookie(cookieName, cvalue.join('|'))

   const version = cookieOpts().version
   if (version !== null && version !== undefined) {
      writeCookie(cookieName + '-v', encodeURIComponent(version))
   }
}

/**
 * Get the granted categories, or test whether `test` is among them.
 * @returns {Array|Boolean} array of categories, false if no cookie, or boolean when `test` is given
 */
export const getConsentControlCookie = (test) => {
   const raw = readRawCookie(resolveCookieName())
   if (raw === null) {
      return test ? false : false
   }
   const values = raw === '' ? [] : raw.split('|')
   if (test) {
      return values.includes(test)
   }
   return values
}

/**
 * Read the consent version stored alongside the cookie ({name}-v), or null.
 */
export const getConsentVersion = () => {
   const raw = readRawCookie(resolveCookieName() + '-v')
   return raw === null ? null : decodeURIComponent(raw)
}

/**
 * Expire the consent cookie (and its version companion) on the current domain.
 */
export const clearConsentControlCookie = () => {
   const opts = cookieOpts()
   const domain = opts.cookieDomain || window.location.hostname
   const path = opts.cookiePath || '/'
   const expire = (name) => {
      document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=' + path + ';domain=' + domain
   }
   expire(resolveCookieName())
   expire(resolveCookieName() + '-v')
}

/**
 * Delete all cookies from this page (reset button).
 */
export const deleteAllCookies = () => {
   var cookies = document.cookie.split('; ')
   for (var c = 0; c < cookies.length; c++) {
      var d = window.location.hostname.split('.')
      while (d.length > 0) {
         var cookieBase =
            encodeURIComponent(cookies[c].split(';')[0].split('=')[0]) +
            '=; expires=Thu, 01-Jan-1970 00:00:01 GMT; domain=' +
            d.join('.') +
            ' ;path='
         var p = location.pathname.split('/')
         document.cookie = cookieBase + '/'
         while (p.length > 0) {
            document.cookie = cookieBase + p.join('/')
            p.pop()
         }
         d.shift()
      }
   }
   window.localStorage.clear()

   const strings = (cookieOpts().template && cookieOpts().template.strings) || {}
   if (strings.resetMessage) {
      alert(strings.resetMessage)
   }
}
