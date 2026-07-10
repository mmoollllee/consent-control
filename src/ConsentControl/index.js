import { extend, getConsentControlCookie, setConsentControlCookie, getConsentVersion, clearConsentControlCookie, template, loadScript } from '../lib/index'

import { defaults } from './defaults'

const ConsentControl = {
   options: {}
}

const self = ConsentControl

self.init = (options = {}) => {
   self.options = extend(true, defaults, options)

   // Accept `categories`/`children` as preferred aliases for `switches`/`childs`
   // so PHP/HTML config can use the clearer vocabulary. `switches`/`childs`
   // remain supported for backwards compatibility.
   if (self.options.categories && Object.keys(self.options.switches).length === 0) {
      self.options.switches = self.options.categories
   }
   for (const key in self.options.switches) {
      const item = self.options.switches[key]
      if (item && item.children && !item.childs) {
         item.childs = item.children
      }
   }

   self.status = [];

   // Bind every .consent-control--open element (e.g. a "cookie settings" button
   // on the privacy policy page): reopen the banner with the settings expanded.
   document.querySelectorAll(".consent-control--open").forEach(function(e) {
      e.addEventListener('click', (e) => {
         e.preventDefault();
         self.show()
         self.El && self.El.classList.remove('is-collapsed')
      });
   });

   // Show the banner unless we have valid consent for the current version.
   const cookie = getConsentControlCookie();
   const version = self.options.version;
   const versionOk = (version === null || version === undefined)
      || String(getConsentVersion()) === String(version);

   if (cookie && cookie.length && versionOk) {
      runServices();
   } else {
      // Stale consent from an older version → reset it for a fresh opt-in.
      if (cookie && cookie.length && !versionOk) {
         clearConsentControlCookie();
      }
      self.show()
   }
}


/**
 * Initalise or (re-)open the Consent Control Banner with saved preferences if available
 */
self.show = () => {
   const cookie = getConsentControlCookie();
   self.El = document.querySelector('#consent-control-banner');
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
         template(self, 'main')
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
      header.innerHTML = template(self, 'header')
      container.appendChild(header)
      openButton = header.querySelector('.consent-control--open')
   }

   // Switches
   let switches = container.querySelector('.switches')

   if (!switches) {
      container.insertAdjacentHTML(
         'beforeend',
         template(self, 'switches')
      )
      switches = container.querySelector('.switches')

      // Insert Switches with Childs Informations
      for (const [key, item] of Object.entries(
         self.options.switches
      )) {
         switches.insertAdjacentHTML(
            'beforeend',
            template(self, 'switch', key, item)
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
                  template(self, 'switchChild', false, false, child)
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
         template(self, 'footer')
      )
      submitButton = container.querySelector('#consent-control--submit')
   }

   // Optional, opt-in "reject all" button (see `rejectButton` option)
   if (self.options.rejectButton && !container.querySelector('#consent-control--submit-none')) {
      const rejectMarkup = template(self, 'rejectButton')
      if (submitButton) {
         submitButton.insertAdjacentHTML('beforebegin', rejectMarkup)
      } else {
         const control = container.querySelector('.control') || container
         control.insertAdjacentHTML('beforeend', rejectMarkup)
      }
   }

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
    * Bind Event to Reject All Button (optional, opt-in via `rejectButton: true`).
    * Saves only the locked necessary categories and rejects everything optional.
    */
   const denyButton = self.El.querySelector("#consent-control--submit-none")
   if (denyButton) {
      denyButton.addEventListener('click', (e) => {
         e.preventDefault();
         const cookie = [];

         self.El.querySelectorAll("input").forEach((i) => {
            if (i.disabled && i.checked) {
               cookie.push(i.value)
            }
         })

         setConsentControlCookie(cookie);
         self.El.classList.add("hide", "is-collapsed")
         runServices();
      });
   }

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

   self.status.push("events");
}

/**
 * Initalise enabled services
 * @param {Array} ccookie Current Cookie Data with services to be enabled
 */
/**
 * Activate scripts that were blocked until consent:
 *   <script type="text/plain" data-consent="analytics" src="…"></script>
 * Re-creates them as real, executable <script> tags. Idempotent (replaced nodes
 * no longer match the selector).
 */
function activateBlockedScripts(consent) {
   document.querySelectorAll('script[type="text/plain"][data-consent="' + consent + '"]').forEach((old) => {
      const s = document.createElement('script')
      for (let i = 0; i < old.attributes.length; i++) {
         const attr = old.attributes[i]
         if (attr.name === 'type' || attr.name === 'data-consent') continue
         s.setAttribute(attr.name, attr.value)
      }
      if (!old.src) {
         s.text = old.textContent
      }
      old.parentNode.replaceChild(s, old)
   })
}

function runServices() {
   const cookie = getConsentControlCookie();
   if (!cookie) {
      return
   }
   
   self._ran = self._ran || {};

   cookie.forEach((i) => {
      const service = self.options.switches[i];

      if (service && !self._ran[i]) {
         // Declarative scripts: [{ src, async }] — load external <script> tags.
         if (Array.isArray(service.scripts)) {
            service.scripts.forEach((script) => {
               if (script && script.src && !document.querySelector('script[src="' + script.src + '"]')) {
                  loadScript(script.src, () => {})
               }
            })
         }

         // Declarative inline JavaScript executed once on consent.
         if (service.inlineScript) {
            try {
               (new Function(service.inlineScript))()
            } catch (e) {
               console.error('[ConsentControl] inlineScript error for "' + i + '":', e)
            }
         }

         self._ran[i] = true;
      }

      // Imperative callback (backwards compatible).
      if (service && typeof service.callback === 'function') {
         service.callback()
      }

      // Activate any <script type="text/plain" data-consent="…"> tags.
      activateBlockedScripts(i)

      ConsentMessage && ConsentMessage.remove(i)
   })

   // Let consent gates / other listeners react to the current consent state.
   window.dispatchEvent(new CustomEvent('consent-updated', { detail: { consents: cookie } }))

   self.status.push("run");
}

export {ConsentControl}
