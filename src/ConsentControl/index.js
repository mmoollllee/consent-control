import { extend } from '../lib/extend'

import { getConsentControlCookie, setConsentControlCookie } from '../lib/cookie.js'
import { hideConsentControlButtons } from '../lib/functions.js'

import { defaults } from './defaults'

window.ConsentControl = {};
const self = window.ConsentControl;

export const ConsentControl = (options = {}) => {
   self.options = extend(true, defaults, options)

   self.status = [];

   // Show Cookie
   const cookie = getConsentControlCookie()
   if (!cookie) {
      hideConsentControlButtons()
      showConsentControlBanner()
   }
   runServices();

   window.ConsentControl.show = showConsentControlBanner()

   // /**
   //  * Bind Event to Control Button on Privacy Page
   //  */
   // jQuery("#consent-banner--reopen button").click(function (e) {
   //   e.preventDefault();
   //   showConsentBanner();
   //  })

}

/**
 * Initalise or (re-)open the Consent Control Banner with saved preferences if available
 */
function showConsentControlBanner() {
   const cookie = getConsentControlCookie();
   self.El = document.getElementById('#consent-control-banner');
   // if there is no Banner yet
   if (!self.status.includes('initialized')) {
      self.El = initConsentControlBanner()
   }
   if (!self.status.includes('events')) {
      aliveConsentControlBanner()
   }

   if (cookie.length) {
      cookie.forEach(function (i) {
         self.El.querySelectorAll('input[value=' + i + ']').forEach((i) => {
            i.checked = true
         })
      })
   }

   self.El.classList.remove('hide')
}

/**
 * returns container
 */
const initConsentControlBanner = () => {
   const parentEl = self.options.parentEl || document.body

   // Container
   let container = parentEl.querySelector('#consent-control-banner')
   if (!container) {
      parentEl.insertAdjacentHTML(
         'beforeend',
         self.options.template.main()
      )
      container = parentEl.querySelector('#consent-control-banner')
   }

   if (self.options.animated) {
      container.classList.add('is-animated')
   }
   if (self.options.hideOnScroll) {
      container.classList.add('hide-on-scroll')
   }

   // Header with Button to open Settings
   let openButton = container.querySelector('.consent-control--open')

   if (!openButton) {
      const header = document.createElement(
         self.options.template.headerEl
      )
      header.innerHTML = self.options.template.header()
      container.appendChild(header)
      openButton = header.querySelector('.consent-control--open')
   }

   // Switches
   let switches = container.querySelector('.switches')

   if (!switches) {
      container.insertAdjacentHTML(
         'beforeend',
         self.options.template.switches()
      )
      switches = container.querySelector('.switches')

      // Insert Switches with Childs Informations
      for (const [key, item] of Object.entries(
         self.options.switches
      )) {
         switches.insertAdjacentHTML(
            'beforeend',
            self.options.template.switch(key, item)
         )

         const itemEl = switches.lastElementChild

         if (item.description) {
            const descriptionEl = document.createElement('p')
            descriptionEl.classList.add('description')
            descriptionEl.innerHTML = item.description
            itemEl.appendChild(descriptionEl)
         }

         const input = itemEl.querySelector('input')

         if (item.disabled) {
            input.setAttribute('disabled', 'disabled')
         }

         if (item.checked) {
            input.setAttribute('checked', 'checked')
         }

         if (item.childs) {
            const childsEl = document.createElement('ul')
            childsEl.classList.add('childs')
            itemEl.appendChild(childsEl)

            for (const [key, child] of Object.entries(item.childs)) {
               childsEl.insertAdjacentHTML(
                  'beforeend',
                  self.options.template.switchChild(child)
               )

               const childEl = childsEl.lastElementChild

               if (child.description) {
                  const descriptionEl = document.createElement('p')
                  descriptionEl.classList.add('description')
                  descriptionEl.innerHTML = child.description
                  childEl.appendChild(descriptionEl)
               }
            }
         }
      }
   }

   let submitButton = container.querySelector('#consent-control--submit')

   if (!submitButton) {
      container.insertAdjacentHTML(
         'beforeend',
         self.options.template.footer()
      )
      submitButton = container.querySelector('#consent-control--submit')
   }

   // Add class name for <html> element
   document.documentElement.classList.add('with-consentControl')

   self.status.push("initialized");

   return container
}

const aliveConsentControlBanner = () => {
   /**
    * Bind Event to Submit Button
    */
   self.El.querySelector("#consent-control--submit").addEventListener('click', (e) => {
      e.preventDefault();
      const cookie = [];

      self.El.querySelectorAll("input").forEach((i) => {
         if (i.checked) {
            cookie.push(i.value)
         }
      })

      setConsentControlCookie(cookie);
      self.El.classList.add("hide", "is-collapsed")
      runServices();
   });
   
   /**
    * Bind Event to Allow All Button
    */
   self.El.querySelector("#consent-control--submit-all").addEventListener('click', (e) => {
      e.preventDefault();
      const cookie = [];

      self.El.querySelectorAll("input").forEach((i) => {
         cookie.push(i.value)
      })

      setConsentControlCookie(cookie);
      self.El.classList.add("hide", "is-collapsed")
      runServices();
   });

   /**
    * Bind Event to Settings Button
    */
    self.El.querySelectorAll(".consent-control--close").forEach(function(e) {
      e.addEventListener('click', (e) => {
         e.preventDefault();
         self.El.classList.add("is-collapsed");
      });
   });
   self.El.querySelectorAll(".consent-control--open").forEach(function(e) {
      e.addEventListener('click', (e) => {
         e.preventDefault();
         self.El.classList.remove("is-collapsed");
      });
   });

   /**
    * Bind Event to Reset Button
    */
   self.El.querySelectorAll(".consent-control--reset").forEach(function(e) {
      e.addEventListener('click', (e) => {
         e.preventDefault();
         deleteAllCookies();
      });
   });
}

/**
 * Initalise enabled services
 * @param {Array} ccookie Current Cookie Data with services to be enabled
 */
function runServices() {
   const cookie = getConsentControlCookie();
   if (!cookie) {
      return
   }
   console.log(cookie);

   if (cookie.includes('necessary')) {
      if (typeof consentnecessary === 'function') {
         consentnecessary()
      }
   }
   if (cookie.includes('analytics')) {
      if (typeof consentanalytics === 'function') {
         consentanalytics()
      }
   }
   if (cookie.includes('functional')) {
      if (typeof initMaps === 'function') {
         initMaps()
      }
   }
}
