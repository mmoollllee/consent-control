/**
 * Save a value to the ConsentControl Cookie
 * @param {String || Array} cvalue The value to be toggled
 */

/**
 * Get values from Cookie
 * @returns {Array}
 */
const getConsentControlCookie = (
   cookieName = window.ConsentControl.cookieName || 'privacyconsent'
) => {
   var name = cookieName + '=';
   var ca = document.cookie.split(';');
   for (var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') {
         c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
         return c.substring(name.length, c.length).split('|')
      }
   }
   return false
};

/**
 * Hide Privacy Controls on Privacy-Page.
 * Privacy Controls might look like this:
 * <h3>Data collection</h3>
 * <p>Click the following button to edit your settings and enable or disable different services we use for a better user experience</p>
 * <button href="#" title="Privacy Consent Settings" class="consent-control--open">Click to change settings.</button>
 */
const hideConsentControlButtons = () => {
   const buttons = document.querySelectorAll(".consent-control--open");
   if (!buttons || buttons.length < 1) { return false}
   buttons.array.forEach(element => {
      element.style.display = "none";
   });
};

/**
 * Check to see if an object is a plain object (created using "{}" or "new Object").
 * @param {*} obj Variable of any type
 * @returns {Boolean}
 */
const isPlainObject = (obj) => {
  return (
    // separate from primitives
    typeof obj === "object" &&
    // is obvious
    obj !== null &&
    // separate instances (Array, DOM, ...)
    obj.constructor === Object &&
    // separate build-in like Math
    Object.prototype.toString.call(obj) === "[object Object]"
  );
};

/**
 * Merge the contents of two or more objects together into the first object.
 * If passing "true" for first argument, the merge becomes recursive (aka. deep copy).
 * @param  {...any} args
 * @returns {Object}
 */
const extend = (...args) => {
  let deep = false;

  if (typeof args[0] == "boolean") {
    deep = args.shift();
  }

  let result = args[0];

  if (!result || typeof result !== "object") {
    throw new Error("extendee must be an object");
  }

  const extenders = args.slice(1);
  const len = extenders.length;

  for (let i = 0; i < len; i++) {
    const extender = extenders[i];

    for (let key in extender) {
      if (extender.hasOwnProperty(key)) {
        const value = extender[key];

        if (deep && (Array.isArray(value) || isPlainObject(value))) {
          const base = Array.isArray(value) ? [] : {};

          result[key] = extend(true, result.hasOwnProperty(key) ? result[key] : base, value);
        } else {
          result[key] = value;
        }
      }
    }
  }

  return result;
};

window.ConsentControl = {};
const self = window.ConsentControl;
const ConsentControl = (options = {}) => {
   const defaults = {
      cookieName: 'consentcontrol',

      // Element containing main structure
      parentEl: null,

      bootstrap: true,

      template: {
         strings: {
            mainTitle: 'Cookies & Dienste',
            mainDescription: `Diese Webseite nutzt Cookies und externe Dienste.<br /><a
            href="/datenschutz/">Datenschutzbestimmungen</a> <a href="/impressum/">Impressum</a>`,
            settingsButtonLabel: 'Weitere Informationen',
            resetButtonLabel: 'Alle Cookies löschen',
            resetMessage: 'Alle Cookies wurden erfolgreich gelöscht.',
            closeButtonLabel: 'Schließen',
            okButtonLabel: 'OK',
            allButtonLabel: 'Alle erlauben',
         },

         // Main container element. Needs #consent-control-banner
         main: function () {
            return `<div id="consent-control-banner" class="is-collapsed" aria-modal="true" aria-hidden="true" aria-label="{mainTitle}">
            </div>`.replace(
               /{\w+}/g,
               (x) => this.strings[x.substring(1, x.length - 1)] || x
            )
         },

         headerEl: 'header',
         // Header default markup needs to have a button.consent-control--open
         header: function () {
            return `<h3>{mainTitle}</h3>
            <p>{mainDescription}</p>
            <button class="collapsed-only consent-control--open">{settingsButtonLabel}</button>`.replace(
               /{\w+}/g,
               (x) => this.strings[x.substring(1, x.length - 1)] || x
            )
         },

         switches: function () {
            return `<div class="switches"></div>`
         },
         switch: function (key, values) {
            return `<div class="form-check form-switch">
             <input id="consent-{key}" value="{key}" class="form-check-input" type="checkbox" role="switch">
             <label for="consent-{key}" class="form-check-label">{label}</label>
           </div>`
               .replace(
                  /{\w+}/g,
                  (x) => values[x.substring(1, x.length - 1)] || x
               )
               .replace(/{\w+}/g, (x) => (x == '{key}' ? key : x))
         },
         switchChild: function (child) {
            return `<li>
               <h4>{label}</h4>
             </li>`.replace(/{\w+}/g, (x) => child[x.substring(1, x.length - 1)] || x)
         },

         footer: function() {
            return `
            <div class="uncollapsed-only">
                <button class="consent-control--reset">{resetButtonLabel}</button>
            </div>
            <div class="control">
                <button class="secondary uncollapsed-only consent-control--close">{closeButtonLabel}</button>
                <button id="consent-control--submit">{okButtonLabel}</button>
                <button id="consent-control--submit-all">{allButtonLabel}</button>
            </div>`.replace(
               /{\w+}/g,
               (x) => this.strings[x.substring(1, x.length - 1)] || x
            )
         }
      },

      switches: {
         necessary: {
            disabled: true,
            checked: true,
            label: 'Notwendige',
            description: 'Stellt die Funktionalität der Website sicher.',
            childs: [
               {
                  label: 'Seiten-Einstellungen',
                  description: `Speichert Ihre Einstellungen in diesem Banner, Cookie
               <strong>consentbanner</strong> Speicherdauer 1 Jahr`,
               },
               {
                  label: 'Schriftarten',
                  description:
                     'Lädt die Schriftart "Eurostile" von externen Servern von Adobe Fonts / Typekit',
               },
            ],
         },
         analytics: {
            label: 'Analytics',
            description:
               'Erlauben Sie dem Website-Betreiber, das Angebot auf dieser Webseite zu bewerten und zu verbessern.',
            childs: [
               {
                  label: 'Google Tag Manager',
                  description: `'UA-105811621-1, Cookie <strong>_ga</strong> Speicherdauer 2 Jahre`,
               },
            ],
         },
         functional: {
            label: 'Funktionell',
            description: 'Funktionen für die Darstellung der Inhalte.',
            childs: [
               {
                  label: 'Google Maps',
                  description:
                     'Stellt eine Karte mit Routenbeschreibung zur Verfügung und lädt diese von externen Servern von Google.',
               },
            ],
         },
      },
   };
   self.options = extend(true, defaults, options);

   // Show Cookie
   const cookie = getConsentControlCookie();
   if (!cookie) {
      hideConsentControlButtons();
      showConsentControlBanner(cookie);
   }
   // runServices(ccookie);

   // /**
   //  * Bind Event to Control Button on Privacy Page
   //  */
   // jQuery("#consent-banner--reopen button").click(function (e) {
   //   e.preventDefault();
   //   showConsentBanner();
   //  })

   //  /**
   //   * Bind Event to Submit Button
   //   */
   //  jQuery("#consent-banner--submit").click(function (e) {
   //     e.preventDefault();
   //     ccookie = [];
   //     jQuery("#consent-banner").find("input").each(function() {
   //        if (jQuery(this).is(':checked')) {
   //           ccookie.push(jQuery(this).val())
   //        }
   //     })
   //     setConsentBannerCookie(ccookie);
   //     jQuery("#consent-banner").addClass("hide is-collapsed");
   //     runServices(ccookie);
   //  });

   //  /**
   //   * Bind Event to Allow All Button
   //   */
   //  jQuery("#consent-banner--submit-all").click(function (e) {
   //     e.preventDefault();
   //     ccookie = [];
   //     jQuery("#consent-banner").find("input").each(function() {
   //        ccookie.push(jQuery(this).val())
   //     })
   //     setConsentBannerCookie(ccookie);
   //     jQuery("#consent-banner").addClass("hide is-collapsed");
   //     runServices(ccookie);
   //  });

   //  /**
   //   * Bind Event to Settings Button
   //   */
   //  jQuery(".consent-banner--settings").click(function (e) {
   //     e.preventDefault();
   //     jQuery("#consent-banner").toggleClass("is-collapsed");
   //  });

   //  /**
   //   * Bind Event to Reset Button
   //   */
   //  jQuery("#consent-banner--reset").click(function (e) {
   //     e.preventDefault();
   //     deleteAllCookies();
   //     jQuery(this).attr("disabled", "disabled")
   //  });
};

/**
 * Initalise or (re-)open the Consent Control Banner with saved preferences if available
 */
function showConsentControlBanner(cookie = getConsentControlCookie()) {
   var consentControlEl = document.getElementById('#consent-control-banner');

   if (!consentControlEl) {
      consentControlEl = initConsentControlBanner();
   }

   if (cookie) {
      ccookie.forEach(function (i) {
         consentControlEl
            .find('input[value=' + i + ']')
            .prop('checked', 'checked');
      });
   }

   consentControlEl.classList.remove('hide');
}

/**
 * returns container
 */
const initConsentControlBanner = () => {
   const parentEl = self.options.parentEl || document.body;

   if(!self.options.bootstrap) ;

   // Container
   let container = parentEl.querySelector('#consent-control-banner');
   if (!container) {
      parentEl.insertAdjacentHTML(
         'beforeend',
         self.options.template.main()
      );
      container = parentEl.querySelector('#consent-control-banner');
   }

   if (self.options.animated) {
      container.classList.add('is-animated');
   }
   if (self.options.hideOnScroll) {
      container.classList.add('hide-on-scroll');
   }

   // Header with Button to open Settings
   let openButton = container.querySelector('.consent-control--open');

   if (!openButton) {
      const header = document.createElement(
         self.options.template.headerEl
      );
      header.innerHTML = self.options.template.header();
      container.appendChild(header);
      openButton = header.querySelector('.consent-control--open');
   }

   // Switches
   let switches = container.querySelector('.switches');

   if (!switches) {
      container.insertAdjacentHTML(
         'beforeend',
         self.options.template.switches()
      );
      switches = container.querySelector('.switches');

      // Insert Switches with Childs Informations
      for (const [key, item] of Object.entries(
         self.options.switches
      )) {
         switches.insertAdjacentHTML(
            'beforeend',
            self.options.template.switch(key, item)
         );

         const itemEl = switches.lastElementChild;

         if (item.description) {
            const descriptionEl = document.createElement('p');
            descriptionEl.classList.add('description');
            descriptionEl.innerHTML = item.description;
            itemEl.appendChild(descriptionEl);
         }

         const input = itemEl.querySelector('input');

         if (item.disabled) {
            input.setAttribute('disabled', 'disabled');
         }

         if (item.checked) {
            input.setAttribute('checked', 'checked');
         }

         if (item.childs) {
            const childsEl = document.createElement('ul');
            childsEl.classList.add('childs');
            itemEl.appendChild(childsEl);

            for (const [key, child] of Object.entries(item.childs)) {
               childsEl.insertAdjacentHTML(
                  'beforeend',
                  self.options.template.switchChild(child)
               );

               const childEl = childsEl.lastElementChild;

               if (child.description) {
                  const descriptionEl = document.createElement('p');
                  descriptionEl.classList.add('description');
                  descriptionEl.innerHTML = child.description;
                  childEl.appendChild(descriptionEl);
               }
            }
         }
      }
   }

   let submitButton = container.querySelector('#consent-control--submit');

   if(!submitButton) {
      container.insertAdjacentHTML(
         'beforeend',
         self.options.template.footer()
      );
      submitButton = container.querySelector('#consent-control--submit');
   }

   // Add class name for <html> element
   document.documentElement.classList.add('with-consentControl');

   return container
};

export { ConsentControl };
