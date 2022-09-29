/**
 * Save a value to the ConsentControl Cookie
 * @param {String || Array} cvalue The value to be toggled
 */
export const setConsentControlCookie = (
   cvalue,
   cookieName = window.ConsentControl.cookieName || 'privacyconsent'
) => {
   var ccurrent = getConsentControlCookie() || []

   cvalue = Array.isArray(cvalue) ? cvalue : [cvalue]

   for (var i = 0; i < cvalue.length; i++) {
      var item = cvalue[i]

      // Get index of current value in current cookie
      var index = ccurrent.indexOf(item)
      // and push or splice from ccurrent
      if (index === -1) {
         ccurrent.push(item)
      } else {
         ccurrent.splice(item, 1)
      }
   }

   var domain = window.location.hostname
   var exdays = 365
   var d = new Date()
   d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000)
   var expires = 'expires=' + d.toUTCString()
   document.cookie =
      cookieName +
      '=' +
      cvalue.join('|') +
      ';' +
      expires +
      ';path=/;samesite=lax;domain=' +
      domain
}

/**
 * Get values from Cookie or test if "test" is in it
 * @returns {Array}
 */
export const getConsentControlCookie = ( test ) => {
   let cookieName = window.ConsentControl.cookieName || 'privacyconsent'
   cookieName = cookieName + '='
   const ca = document.cookie.split(';')
   for (let i = 0; i < ca.length; i++) {
      let c = ca[i]
      while (c.charAt(0) == ' ') {
         c = c.substring(1)
      }
      if (c.indexOf(cookieName) == 0) {
         const values = c.substring(cookieName.length, c.length).split('|')
         if ( test ) {
            return values.includes(test)
         }
         return values
      }
   }
   return false
}

/**
 * Delete all Cookies from this page
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
   alert(window.ConsentControl.strings.resetMessage)
}
