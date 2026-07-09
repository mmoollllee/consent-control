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
   * Resolve the configured cookie name. Prefers `ConsentControl.options.cookieName`
   * (set via ConsentControl.init), with a legacy fallback and the `consentcontrol`
   * default. Keeps the cookie name consistent across the npm / Laravel / Filament layers.
   */
  const resolveCookieName = () =>
     (window.ConsentControl && window.ConsentControl.cookieName)
     || (window.ConsentControl && window.ConsentControl.options && window.ConsentControl.options.cookieName)
     || 'consentcontrol';

  const cookieOpts = () => (window.ConsentControl && window.ConsentControl.options) || {};

  /**
   * Write a cookie honouring the options provided via ConsentControl.init()
   * (cookieDays, cookieDomain, cookiePath, cookieSameSite, cookieSecure).
   */
  const writeCookie = (name, value) => {
     const opts = cookieOpts();
     const exdays = opts.cookieDays || 365;
     const domain = opts.cookieDomain || window.location.hostname;
     const path = opts.cookiePath || '/';
     const sameSite = opts.cookieSameSite || 'lax';

     const d = new Date();
     d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);

     let cookie = name + '=' + value
        + ';expires=' + d.toUTCString()
        + ';path=' + path
        + ';samesite=' + sameSite
        + ';domain=' + domain;
     if (opts.cookieSecure) {
        cookie += ';secure';
     }
     document.cookie = cookie;
  };

  const readRawCookie = (name) => {
     const prefix = name + '=';
     const ca = document.cookie.split(';');
     for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') {
           c = c.substring(1);
        }
        if (c.indexOf(prefix) === 0) {
           return c.substring(prefix.length)
        }
     }
     return null
  };

  /**
   * Save the granted consent categories to the cookie. Also writes a companion
   * version cookie ({name}-v) when `options.version` is set, so a later version
   * bump can force a fresh opt-in.
   * @param {String | Array} cvalue
   */
  const setConsentControlCookie = (cvalue, cookieName = resolveCookieName()) => {
     cvalue = Array.isArray(cvalue) ? cvalue : [cvalue];

     writeCookie(cookieName, cvalue.join('|'));

     const version = cookieOpts().version;
     if (version !== null && version !== undefined) {
        writeCookie(cookieName + '-v', encodeURIComponent(version));
     }
  };

  /**
   * Get the granted categories, or test whether `test` is among them.
   * @returns {Array|Boolean} array of categories, false if no cookie, or boolean when `test` is given
   */
  const getConsentControlCookie = (test) => {
     const raw = readRawCookie(resolveCookieName());
     if (raw === null) {
        return test ? false : false
     }
     const values = raw === '' ? [] : raw.split('|');
     if (test) {
        return values.includes(test)
     }
     return values
  };

  /**
   * Read the consent version stored alongside the cookie ({name}-v), or null.
   */
  const getConsentVersion = () => {
     const raw = readRawCookie(resolveCookieName() + '-v');
     return raw === null ? null : decodeURIComponent(raw)
  };

  /**
   * Expire the consent cookie (and its version companion) on the current domain.
   */
  const clearConsentControlCookie = () => {
     const opts = cookieOpts();
     const domain = opts.cookieDomain || window.location.hostname;
     const path = opts.cookiePath || '/';
     const expire = (name) => {
        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=' + path + ';domain=' + domain;
     };
     expire(resolveCookieName());
     expire(resolveCookieName() + '-v');
  };

  /**
   * Delete all cookies from this page (reset button).
   */
  const deleteAllCookies$1 = () => {
     var cookies = document.cookie.split('; ');
     for (var c = 0; c < cookies.length; c++) {
        var d = window.location.hostname.split('.');
        while (d.length > 0) {
           var cookieBase =
              encodeURIComponent(cookies[c].split(';')[0].split('=')[0]) +
              '=; expires=Thu, 01-Jan-1970 00:00:01 GMT; domain=' +
              d.join('.') +
              ' ;path=';
           var p = location.pathname.split('/');
           document.cookie = cookieBase + '/';
           while (p.length > 0) {
              document.cookie = cookieBase + p.join('/');
              p.pop();
           }
           d.shift();
        }
     }
     window.localStorage.clear();

     const strings = (cookieOpts().template && cookieOpts().template.strings) || {};
     if (strings.resetMessage) {
        alert(strings.resetMessage);
     }
  };

  const template = (self, name, key, values, child) => {
     let template = self.options.template[name];
     if (values) {
        template = template.replace(/{\w+}/g, (x) => values[x.substring(1, x.length - 1)] || x);
     }
     if (key) {
        template = template.replace(/{\w+}/g, (x) => (x == '{key}' ? key : x));
     }
     if (child) {
        template = template.replace(/{\w+}/g, (x) => child[x.substring(1, x.length - 1)] || x);
     }
     template = template.replace(
        /{\w+}/g,
        (x) => self.options.template.strings[x.substring(1, x.length - 1)] || x
     );
     return template
  };

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

  const defaults$1 = {
     cookieName: 'consentcontrol',

     // Consent version. Bump to force a fresh opt-in when your categories/policy
     // change: when the stored version cookie differs, existing consent is reset
     // and the banner re-appears. Leave null to disable versioning.
     version: null,

     // Element containing main structure
     parentEl: null,

     // Show an optional, explicit "reject all" button. Opt-in: leave false when
     // your default selection is already minimal (then "OK" already rejects every
     // optional service). Set true if you pre-check optional switches.
     rejectButton: false,

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
           noneButtonLabel: 'Alle ablehnen',
        },

        // Main container element. Needs #consent-control-banner
        main: `<div id="consent-control-banner" class="is-collapsed" aria-modal="true" aria-hidden="true" aria-label="{mainTitle}">
         </div>`,

        headerEl: 'header',
        // Header default markup needs to have a button.consent-control--open
        header: `<h3>{mainTitle}</h3>
         <p>{mainDescription}</p>
         <button class="collapsed-only consent-control--open">{settingsButtonLabel}</button>`,

        switches: `<div class="switches"></div>`,
        switch: `<div class="form-check form-switch">
          <input id="consent-{key}" value="{key}" class="form-check-input" type="checkbox" role="switch">
          <label for="consent-{key}" class="form-check-label">{label}</label>
        </div>`,
        switchChild: `<li>
            <h4>{label}</h4>
          </li>`,

        footer: `
         <div class="uncollapsed-only">
             <button class="consent-control--reset">{resetButtonLabel}</button>
         </div>
         <div class="control">
             <button class="secondary uncollapsed-only consent-control--close">{closeButtonLabel}</button>
             <button id="consent-control--submit">{okButtonLabel}</button>
             <button id="consent-control--submit-all">{allButtonLabel}</button>
         </div>`,

        // Markup for the optional reject-all button (enabled via `rejectButton: true`).
        rejectButton: `<button class="secondary uncollapsed-only consent-control--deny" id="consent-control--submit-none">{noneButtonLabel}</button>`
     },

     switches: {},
  };

  const ConsentControl = {
     options: {}
  };

  const self$1 = ConsentControl;

  self$1.init = (options = {}) => {
     self$1.options = extend(true, defaults$1, options);

     // Accept `categories`/`children` as preferred aliases for `switches`/`childs`
     // so PHP/HTML config can use the clearer vocabulary. `switches`/`childs`
     // remain supported for backwards compatibility.
     if (self$1.options.categories && Object.keys(self$1.options.switches).length === 0) {
        self$1.options.switches = self$1.options.categories;
     }
     for (const key in self$1.options.switches) {
        const item = self$1.options.switches[key];
        if (item && item.children && !item.childs) {
           item.childs = item.children;
        }
     }

     self$1.status = [];

     // Bind Event to Control Button on Privacy Page
     document.querySelectorAll(".consent-control--open").forEach(function(e) {
        e.addEventListener('click', (e) => {
           e.preventDefault();
           self$1.show();
        });
     });

     // Show the banner unless we have valid consent for the current version.
     const cookie = getConsentControlCookie();
     const version = self$1.options.version;
     const versionOk = (version === null || version === undefined)
        || String(getConsentVersion()) === String(version);

     if (cookie && cookie.length && versionOk) {
        runServices();
     } else {
        // Stale consent from an older version → reset it for a fresh opt-in.
        if (cookie && cookie.length && !versionOk) {
           clearConsentControlCookie();
        }
        self$1.show();
     }
  };


  /**
   * Initalise or (re-)open the Consent Control Banner with saved preferences if available
   */
  self$1.show = () => {
     const cookie = getConsentControlCookie();
     self$1.El = document.querySelector('#consent-control-banner');
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
           template(self$1, 'main')
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
        header.innerHTML = template(self$1, 'header');
        container.appendChild(header);
        openButton = header.querySelector('.consent-control--open');
     }

     // Switches
     let switches = container.querySelector('.switches');

     if (!switches) {
        container.insertAdjacentHTML(
           'beforeend',
           template(self$1, 'switches')
        );
        switches = container.querySelector('.switches');

        // Insert Switches with Childs Informations
        for (const [key, item] of Object.entries(
           self$1.options.switches
        )) {
           switches.insertAdjacentHTML(
              'beforeend',
              template(self$1, 'switch', key, item)
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
                    template(self$1, 'switchChild', false, false, child)
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
           template(self$1, 'footer')
        );
        submitButton = container.querySelector('#consent-control--submit');
     }

     // Optional, opt-in "reject all" button (see `rejectButton` option)
     if (self$1.options.rejectButton && !container.querySelector('#consent-control--submit-none')) {
        const rejectMarkup = template(self$1, 'rejectButton');
        if (submitButton) {
           submitButton.insertAdjacentHTML('beforebegin', rejectMarkup);
        } else {
           const control = container.querySelector('.control') || container;
           control.insertAdjacentHTML('beforeend', rejectMarkup);
        }
     }

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
      * Bind Event to Reject All Button (optional, opt-in via `rejectButton: true`).
      * Saves only the locked necessary categories and rejects everything optional.
      */
     const denyButton = self$1.El.querySelector("#consent-control--submit-none");
     if (denyButton) {
        denyButton.addEventListener('click', (e) => {
           e.preventDefault();
           const cookie = [];

           self$1.El.querySelectorAll("input").forEach((i) => {
              if (i.disabled && i.checked) {
                 cookie.push(i.value);
              }
           });

           setConsentControlCookie(cookie);
           self$1.El.classList.add("hide", "is-collapsed");
           runServices();
        });
     }

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

     self$1.status.push("events");
  };

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
        const s = document.createElement('script');
        for (let i = 0; i < old.attributes.length; i++) {
           const attr = old.attributes[i];
           if (attr.name === 'type' || attr.name === 'data-consent') continue
           s.setAttribute(attr.name, attr.value);
        }
        if (!old.src) {
           s.text = old.textContent;
        }
        old.parentNode.replaceChild(s, old);
     });
  }

  function runServices() {
     const cookie = getConsentControlCookie();
     if (!cookie) {
        return
     }
     
     self$1._ran = self$1._ran || {};

     cookie.forEach((i) => {
        const service = self$1.options.switches[i];

        if (service && !self$1._ran[i]) {
           // Declarative scripts: [{ src, async }] — load external <script> tags.
           if (Array.isArray(service.scripts)) {
              service.scripts.forEach((script) => {
                 if (script && script.src && !document.querySelector('script[src="' + script.src + '"]')) {
                    loadScript(script.src, () => {});
                 }
              });
           }

           // Declarative inline JavaScript executed once on consent.
           if (service.inlineScript) {
              try {
                 (new Function(service.inlineScript))();
              } catch (e) {
                 console.error('[ConsentControl] inlineScript error for "' + i + '":', e);
              }
           }

           self$1._ran[i] = true;
        }

        // Imperative callback (backwards compatible).
        if (service && typeof service.callback === 'function') {
           service.callback();
        }

        // Activate any <script type="text/plain" data-consent="…"> tags.
        activateBlockedScripts(i);

        ConsentMessage && ConsentMessage.remove(i);
     });

     // Let consent gates / other listeners react to the current consent state.
     window.dispatchEvent(new CustomEvent('consent-updated', { detail: { consents: cookie } }));

     self$1.status.push("run");
  }

  const defaults = {
     
     template: {
        strings: {
           message: `Diese Inhalte werden extern geladen von <i class="consent-message--source">{srcName}</i>.<br />Durch das Aktivieren dieses Inhalts werden Daten wie Ihre IP-Adresse an den externen Server übertragen. Weitere Informationen entnehmen Sie bitte unserer <a href="/datenschutz/" title="Datenschutzerklärung lesen">Datenschutzerklärung</a>.`,
           buttonLabel: 'Inhalte laden',
        },

        main: `<div class="consent-message"><button class="button confirm">{buttonLabel}</button><p>{message}</p></div>`,
     }
  };

  const ConsentMessage$1 = {
     callbacks: {}
  };

  const self = ConsentMessage$1;

  self.new = (
     consent, 
     target, 
     options = {}, 
     srcName, 
     callback = () => {
        target = target.tagName === 'IFRAME' ? target : target.querySelector('iframe');
        target.setAttribute('src', target.getAttribute('data-src'));
        removeConsentMessage(target);
     }
  ) => {
     self.options = extend(true, defaults, options);

     // if consent is already given, else bind callback to target
     if (consent && getConsentControlCookie(consent)) {
        callback();
        removeConsentMessage(target);
        return
     } else {
        target.callback = function() {
           callback();
           removeConsentMessage(target);
           delete target.callback;
        };
     }

     // Get srcName
     if (!srcName) {
        const innerIframe = target.tagName === 'IFRAME' ? target : target.querySelector('iframe');
        const src = innerIframe ? (innerIframe.getAttribute('data-src') || innerIframe.getAttribute('src')) : target.getAttribute('data-src');
        srcName = target.getAttribute('data-src-name') ?? (src ? toLocation(src).hostname : '');
     }

     let wrapper = target;
     if (self.options.template) {
        // Wrap target with .privacy--wrapper if it's an iframe
        if (target.tagName === 'IFRAME') {
           wrapper = document.createElement('div');
           wrapper.classList.add('consent-message--wrapper');
           target.parentNode.insertBefore(wrapper, target);
           wrapper.appendChild(target);
        }

        if (!wrapper.querySelector('.consent-message')) {
           // Insert .consent-message with button.confirm
           wrapper.insertAdjacentHTML(
              'afterbegin',
              template(self, 'main').replace(
                 /{\w+}/g, srcName
              )
           );
        }
     }

     // bind callback event
     wrapper.querySelector('button.confirm').addEventListener('click', () => target.callback());
     
     // add target to consent groups' instances
     if ( !self.callbacks[consent] ) {
        self.callbacks[consent] = [];
     }
     self.callbacks[consent].push(target);
  };

  self.remove = (consent) => {
     const targets = self.callbacks[consent] || [];
     targets.forEach((e) => {
        e.callback();
     });
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

  window.deleteAllCookies = deleteAllCookies$1;
  window.loadScript = loadScript;
  window.getConsentControlCookie = getConsentControlCookie;
  window.getConsentVersion = getConsentVersion;
  window.clearConsentControlCookie = clearConsentControlCookie;
  window.ConsentControl = ConsentControl;
  window.ConsentMessage = ConsentMessage$1;

  exports.ConsentControl = ConsentControl;
  exports.ConsentMessage = ConsentMessage$1;
  exports.clearConsentControlCookie = clearConsentControlCookie;
  exports.deleteAllCookies = deleteAllCookies$1;
  exports.getConsentControlCookie = getConsentControlCookie;
  exports.getConsentVersion = getConsentVersion;
  exports.loadScript = loadScript;

  Object.defineProperty(exports, '__esModule', { value: true });

  return exports;

})({});
