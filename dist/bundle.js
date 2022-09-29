(function (exports) {
  'use strict';

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

  const toLocation = (url) => {
     const a = document.createElement('a');
     a.href = url;
     return a
  };

  /**
   * Save a value to the ConsentControl Cookie
   * @param {String || Array} cvalue The value to be toggled
   */
  const setConsentControlCookie = (
     cvalue,
     cookieName = window.ConsentControl.cookieName || 'privacyconsent'
  ) => {
     var ccurrent = getConsentControlCookie() || [];

     cvalue = Array.isArray(cvalue) ? cvalue : [cvalue];

     for (var i = 0; i < cvalue.length; i++) {
        var item = cvalue[i];

        // Get index of current value in current cookie
        var index = ccurrent.indexOf(item);
        // and push or splice from ccurrent
        if (index === -1) {
           ccurrent.push(item);
        } else {
           ccurrent.splice(item, 1);
        }
     }

     var domain = window.location.hostname;
     var exdays = 365;
     var d = new Date();
     d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
     var expires = 'expires=' + d.toUTCString();
     document.cookie =
        cookieName +
        '=' +
        cvalue.join('|') +
        ';' +
        expires +
        ';path=/;samesite=lax;domain=' +
        domain;
  };

  /**
   * Get values from Cookie or test if "test" is in it
   * @returns {Array}
   */
  const getConsentControlCookie = ( test ) => {
     let cookieName = window.ConsentControl.cookieName || 'privacyconsent';
     cookieName = cookieName + '=';
     const ca = document.cookie.split(';');
     for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
           c = c.substring(1);
        }
        if (c.indexOf(cookieName) == 0) {
           const values = c.substring(cookieName.length, c.length).split('|');
           if ( test ) {
              return values.includes(test)
           }
           return values
        }
     }
     return false
  };

  const template = (self, name) => {
     return self.options.template[name].replace(
        /{\w+}/g,
        (x) => self.options.template.strings[x.substring(1, x.length - 1)] || x
     )
  };

  const defaults$1 = {
     cookieName: 'consentcontrol',

     // Element containing main structure
     parentEl: null,

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

     switches: {},
  };

  window.ConsentControl = {};
  const self$1 = window.ConsentControl;
  exports.ConsentControl = exports.ConsentControl();

  exports.ConsentControl = (options = {}) => {
     self$1.options = extend(true, defaults$1, options);

     self$1.status = [];

     // Bind Event to Control Button on Privacy Page
     document.querySelectorAll(".consent-control--open").forEach(function(e) {
        e.addEventListener('click', (e) => {
           e.preventDefault();
           window.ConsentControl.show();
        });
     });

     // Show Cookie
     if (!getConsentControlCookie()) {
        window.ConsentControl.show();
     }
     runServices();

  };

  /**
   * Initalise or (re-)open the Consent Control Banner with saved preferences if available
   */
  window.ConsentControl.show = () => {
     const cookie = getConsentControlCookie();
     self$1.El = document.getElementById('#consent-control-banner');
     // if there is no Banner yet
     if (!self$1.status.includes('initialized')) {
        self$1.El = initConsentControlBanner();
     }
     if (!self$1.status.includes('events')) {
        aliveConsentControlBanner();
     }

     if (cookie.length) {
        cookie.forEach(function (i) {
           self$1.El.querySelectorAll('input[value=' + i + ']').forEach((i) => {
              i.checked = true;
           });
        });
     }

     self$1.El.classList.remove('hide');
  };

  /**
   * returns container
   */
  const initConsentControlBanner = () => {
     const parentEl = self$1.options.parentEl || document.body;

     // Container
     let container = parentEl.querySelector('#consent-control-banner');
     if (!container) {
        parentEl.insertAdjacentHTML(
           'beforeend',
           self$1.options.template.main()
        );
        container = parentEl.querySelector('#consent-control-banner');
     }

     if (self$1.options.animated) {
        container.classList.add('is-animated');
     }
     if (self$1.options.hideOnScroll) {
        container.classList.add('hide-on-scroll');
     }

     // Header with Button to open Settings
     let openButton = container.querySelector('.consent-control--open');

     if (!openButton) {
        const header = document.createElement(
           self$1.options.template.headerEl
        );
        header.innerHTML = self$1.options.template.header();
        container.appendChild(header);
        openButton = header.querySelector('.consent-control--open');
     }

     // Switches
     let switches = container.querySelector('.switches');

     if (!switches) {
        container.insertAdjacentHTML(
           'beforeend',
           self$1.options.template.switches()
        );
        switches = container.querySelector('.switches');

        // Insert Switches with Childs Informations
        for (const [key, item] of Object.entries(
           self$1.options.switches
        )) {
           switches.insertAdjacentHTML(
              'beforeend',
              self$1.options.template.switch(key, item)
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
                    self$1.options.template.switchChild(child)
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

     if (!submitButton) {
        container.insertAdjacentHTML(
           'beforeend',
           self$1.options.template.footer()
        );
        submitButton = container.querySelector('#consent-control--submit');
     }

     // Add class name for <html> element
     document.documentElement.classList.add('with-consentControl');

     self$1.status.push("initialized");

     return container
  };

  const aliveConsentControlBanner = () => {
     /**
      * Bind Event to Submit Button
      */
     self$1.El.querySelector("#consent-control--submit").addEventListener('click', (e) => {
        e.preventDefault();
        const cookie = [];

        self$1.El.querySelectorAll("input").forEach((i) => {
           if (i.checked) {
              cookie.push(i.value);
           }
        });

        setConsentControlCookie(cookie);
        self$1.El.classList.add("hide", "is-collapsed");
        runServices();
     });
     
     /**
      * Bind Event to Allow All Button
      */
     self$1.El.querySelector("#consent-control--submit-all").addEventListener('click', (e) => {
        e.preventDefault();
        const cookie = [];

        self$1.El.querySelectorAll("input").forEach((i) => {
           cookie.push(i.value);
        });

        setConsentControlCookie(cookie);
        self$1.El.classList.add("hide", "is-collapsed");
        runServices();
     });

     /**
      * Bind Event to Settings Button
      */
      self$1.El.querySelectorAll(".consent-control--close").forEach(function(e) {
        e.addEventListener('click', (e) => {
           e.preventDefault();
           self$1.El.classList.add("is-collapsed");
        });
     });
     self$1.El.querySelectorAll(".consent-control--open").forEach(function(e) {
        e.addEventListener('click', (e) => {
           e.preventDefault();
           self$1.El.classList.remove("is-collapsed");
        });
     });

     /**
      * Bind Event to Reset Button
      */
     self$1.El.querySelectorAll(".consent-control--reset").forEach(function(e) {
        e.addEventListener('click', (e) => {
           e.preventDefault();
           deleteAllCookies();
        });
     });
  };

  /**
   * Initalise enabled services
   * @param {Array} ccookie Current Cookie Data with services to be enabled
   */
  function runServices() {
     const cookie = getConsentControlCookie();
     if (!cookie) {
        return
     }
     
     cookie.forEach((i) => {
        if (typeof self$1.options.switches[i].callback === 'function') {
           self$1.options.switches[i].callback();
        }
     });

  }

  const loadScript = (src, callback) => {
     var s,
         r,
         t;
     r = false;
     s = document.createElement('script');
     s.type = 'text/javascript';
     s.src = src;
     s.onload = s.onreadystatechange = function() {
       //console.log( this.readyState ); //uncomment this line to see which ready states are called.
       if ( !r && (!this.readyState || this.readyState == 'complete') )
       {
         r = true;
         callback();
       }
     };
     t = document.getElementsByTagName('script')[0];
     t.parentNode.insertBefore(s, t);
  };

  const defaults = {
     
     template: {
        strings: {
           message: `Diese Inhalte werden extern geladen von <i class="consent-message--source">{srcName}</i>.<br />Durch das Aktivieren dieses Inhalts werden Daten wie Ihre IP-Adresse an den externen Server übertragen. Weitere Informationen entnehmen Sie bitte unserer <a href="/datenschutz/" title="Datenschutzerklärung lesen">Datenschutzerklärung</a>.`,
           buttonLabel: 'Inhalte laden',
        },

        main: `<div class="consent-message"><button class="button confirm">{buttonLabel}</button><p>{message}</p></div>`,
     }
  };

  window.ConsentMessage = {};
  const self = window.ConsentMessage;

  const ConsentMessage = (consent, options = {}, target, srcName, callback = () => {
     target.setAttribute('src', target.getAttribute('data-src'));
     removeConsentMessage(target);
  }) => {
     self.options = extend(true, defaults, options);

     self.status = [];

     if (consent && getConsentControlCookie(consent)) {
        callback();
        return
     }

     // Get srcName
     if (!srcName) {
        const src = target.getAttribute('data-src');
        srcName = target.getAttribute('data-src-name') ?? toLocation(src).hostname;
     }

     // Wrap target with .privacy--wrapper if it's an iframe
     let wrapper = target;
     if (target.tagName === 'IFRAME') {
        wrapper = document.createElement('div');
        wrapper.classList.add('consent-message--wrapper');
        target.parentNode.insertBefore(wrapper, target);
        wrapper.appendChild(target);
     }

     // Insert .consent-message with button.confirm
     wrapper.insertAdjacentHTML(
        'afterbegin',
        template(self, 'main').replace(
           /{\w+}/g, srcName
        )
     );

     // bind callback event
     wrapper.querySelector('button.confirm').addEventListener('click', callback);

  };

  const removeConsentMessage = (target) => {
     if (target.tagName === 'IFRAME') {
        target = target.parentNode;
     }
     const messageDiv = target.querySelector('.consent-message');
     if (messageDiv) {
        messageDiv.remove();
     }
  };

  exports.ConsentMessage = ConsentMessage;
  exports.getConsentControlCookie = getConsentControlCookie;
  exports.loadScript = loadScript;

  Object.defineProperty(exports, '__esModule', { value: true });

  return exports;

})({});
