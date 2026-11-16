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
   * Whether the stored consent was given for the configured `version` (always true
   * while versioning is off). Outdated consent counts as no consent.
   */
  const consentVersionOk = () => {
     const version = cookieOpts().version;
     return version === null || version === undefined
        || String(getConsentVersion()) === String(version)
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
   * Delete all cookies and localStorage entries from this page (reset button).
   * @param {Array} keep cookie names / localStorage keys to spare (e.g. session, cart):
   *    exact names, or prefixes ending in `*`
   */
  const deleteAllCookies = (keep = []) => {
     const kept = (name) => [].concat(keep || []).some((pattern) => pattern.endsWith('*')
        ? name.startsWith(pattern.slice(0, -1))
        : name === pattern);

     var cookies = document.cookie.split('; ');
     for (var c = 0; c < cookies.length; c++) {
        const name = cookies[c].split(';')[0].split('=')[0];
        if (!name || kept(name)) {
           continue
        }
        var d = window.location.hostname.split('.');
        while (d.length > 0) {
           var cookieBase =
              encodeURIComponent(name) +
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
     try {
        Object.keys(window.localStorage).forEach((key) => {
           if (!kept(key)) {
              window.localStorage.removeItem(key);
           }
        });
     } catch (e) {
        // storage blocked (privacy settings, sandboxed iframe): nothing to delete
     }

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

     // Reload the page when the visitor withdraws a category that was applied on
     // this page, and after the reset button deleted the cookies: scripts loaded
     // for it keep running otherwise. Set false to handle a withdrawal yourself
     // (see the `consent-updated` event and its `detail.revoked`).
     reloadOnRevoke: true,

     // Cookie names and localStorage keys the reset button must not delete, e.g.
     // the session or the cart: exact names, or prefixes ending in `*`.
     keepOnReset: [],

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
        // (non-modal: the page stays usable while it is open)
        main: `<div id="consent-control-banner" class="is-collapsed" role="dialog" aria-label="{mainTitle}">
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
     // copy the defaults, so options of an earlier init() call don't stick
     self$1.options = extend(true, {}, defaults$1, options);

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

     // Bind every .consent-control--open element (e.g. a "cookie settings" button
     // on the privacy policy page): reopen the banner with the settings expanded.
     document.querySelectorAll(".consent-control--open").forEach(function(e) {
        e.addEventListener('click', (e) => {
           e.preventDefault();
           self$1.open();
        });
     });

     // A server-rendered banner that starts hidden stays out of reach for
     // keyboard and screen readers until it is shown.
     self$1.El = document.querySelector('#consent-control-banner');
     if (self$1.El && self$1.El.classList.contains('hide')) {
        setHidden(true);
     }

     // Show the banner unless we have valid consent for the current version.
     const cookie = getConsentControlCookie();
     const versionOk = consentVersionOk();

     // Stale consent from an older version → reset it for a fresh opt-in.
     if (cookie && cookie.length && !versionOk) {
        clearConsentControlCookie();
     }

     // ConsentMessage.new() calls made before init() waited for this check
     window.ConsentMessage && window.ConsentMessage.consentChecked && window.ConsentMessage.consentChecked();

     if (cookie && cookie.length && versionOk) {
        runServices();
     } else {
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

     // Reflect the saved choice: granted categories on, the others off, so "OK"
     // does not grant a pre-checked category the visitor rejected before. Locked
     // (disabled) switches keep their configured state unless granted.
     if (cookie) {
        self$1.El.querySelectorAll('input').forEach((input) => {
           if (cookie.includes(input.value)) {
              input.checked = true;
           } else if (!input.disabled) {
              input.checked = false;
           }
        });
     }

     // Server-rendered banners ship with an inline display:none so they can
     // never flash before CSS/JS load. Visibility is JS-only: clear the inline
     // style here, with a reflow in between so the `hide` transition still
     // slides the banner in.
     if (self$1.El.style.display === 'none') {
        self$1.El.style.removeProperty('display');
        void self$1.El.offsetWidth;
     }

     self$1.El.classList.remove('hide');
     setHidden(false);
  };

  /**
   * Reopen the banner with the settings expanded and move the focus into it
   * (what every .consent-control--open element does).
   */
  self$1.open = () => {
     const active = document.activeElement;
     self$1.show();
     // remember where the visitor came from, to return there on save
     if (active && active !== document.body && !self$1.El.contains(active)) {
        self$1.opener = active;
     }
     self$1.El.classList.remove('is-collapsed');
     focusBanner();
  };

  /**
   * Hide the banner after a choice was saved
   */
  const hide = () => {
     const focused = self$1.El.contains(document.activeElement) && document.activeElement;
     self$1.El.classList.add("hide", "is-collapsed");
     setHidden(true);
     // the focus must not stay in the hidden banner: return it to the opener
     if (focused) {
        if (self$1.opener && self$1.opener.isConnected) {
           self$1.opener.focus();
        } else {
           focused.blur();
        }
     }
     self$1.opener = null;
  };

  /**
   * Keep screen readers and keyboard focus in line with the banner's visibility
   * (the hidden banner is only faded and moved out of view).
   */
  const setHidden = (hidden) => {
     if (hidden) {
        self$1.El.setAttribute('aria-hidden', 'true');
        self$1.El.setAttribute('inert', '');
     } else {
        self$1.El.removeAttribute('aria-hidden');
        self$1.El.removeAttribute('inert');
     }
  };

  /**
   * Move the focus to the banner itself, e.g. when the focused button disappears
   * by expanding or collapsing the settings.
   */
  const focusBanner = () => {
     if (!self$1.El.hasAttribute('tabindex')) {
        self$1.El.setAttribute('tabindex', '-1');
     }
     self$1.El.focus({ preventScroll: true });
  };

  /**
   * Reload the page, so scripts of withdrawn categories stop running
   */
  const reload = () => {
     window.location.reload();
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
        hide();
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
        hide();
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
           hide();
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
           focusBanner();
        });
     });
     self$1.El.querySelectorAll(".consent-control--open").forEach(function(e) {
        e.addEventListener('click', (e) => {
           e.preventDefault();
           self$1.El.classList.remove("is-collapsed");
           focusBanner();
        });
     });

     /**
      * Bind Event to Reset Button
      */
     self$1.El.querySelectorAll(".consent-control--reset").forEach(function(e) {
        e.addEventListener('click', (e) => {
           e.preventDefault();
           deleteAllCookies(self$1.options.keepOnReset);
           // services of this page would set their cookies again
           if (self$1.options.reloadOnRevoke) {
              reload();
           }
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
     document.querySelectorAll('script[type="text/plain"][data-consent]').forEach((old) => {
        // compared here instead of in the selector: the value comes from the cookie
        if (old.getAttribute('data-consent') !== consent) {
           return
        }
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

     // categories applied earlier on this page that are withdrawn now
     const revoked = (self$1._applied || []).filter((i) => !cookie.includes(i));
     self$1._applied = cookie;

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

           // Imperative callback (backwards compatible), once per page like the
           // declarative services: a failing one must not stop the others.
           if (typeof service.callback === 'function') {
              try {
                 service.callback();
              } catch (e) {
                 console.error('[ConsentControl] callback error for "' + i + '":', e);
              }
           }

           self$1._ran[i] = true;
        }

        // Activate any <script type="text/plain" data-consent="…"> tags.
        activateBlockedScripts(i);

        window.ConsentMessage && window.ConsentMessage.remove(i);
     });

     // Let consent gates / other listeners react to the current consent state.
     window.dispatchEvent(new CustomEvent('consent-updated', { detail: { consents: cookie, revoked } }));

     self$1.status.push("run");

     // What withdrawn categories loaded keeps running until the page is reloaded
     if (revoked.length && self$1.options.reloadOnRevoke) {
        reload();
     }
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

  const ConsentMessage = {
     callbacks: {}
  };

  const self = ConsentMessage;

  // Messages created while a stored consent was not validated by ConsentControl.init()
  // yet: init() may still discard it (e.g. after a version bump). See consentChecked().
  let pending = [];
  let consentCheckDone = false;

  self.new = (
     consent, 
     target, 
     options = {}, 
     srcName, 
     callback = () => {
        // local variable: `target` must stay the registered element (see target.callback)
        const iframe = target.tagName === 'IFRAME' ? target : target.querySelector('iframe');
        iframe.setAttribute('src', iframe.getAttribute('data-src'));
        removeConsentMessage(iframe);
     }
  ) => {
     // stored consent not validated yet: wait for ConsentControl.init()
     if (consent && !consentCheckDone && getConsentControlCookie(consent)) {
        waitForConsentCheck([consent, target, options, srcName, callback]);
        return
     }

     // copy the defaults, so options stay local to this message
     self.options = extend(true, {}, defaults, options);

     // if consent is already given, else bind callback to target
     if (consent && getConsentControlCookie(consent) && consentVersionOk()) {
        callback();
        removeConsentMessage(target);
        return
     } else {
        target.callback = function() {
           callback();
           removeConsentMessage(target);
           delete target.callback;
           // resolved: drop target from its consent group, so remove() won't call it again
           if (self.callbacks[consent]) {
              self.callbacks[consent] = self.callbacks[consent].filter((e) => e !== target);
           }
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

     // bind callback event (custom markup may come without a button)
     const button = wrapper.querySelector('button.confirm');
     if (button) {
        // the button may outlive the message (custom markup): ignore clicks once resolved
        button.addEventListener('click', () => target.callback && target.callback());
     }
     
     // add target to consent groups' instances
     if ( !self.callbacks[consent] ) {
        self.callbacks[consent] = [];
     }
     self.callbacks[consent].push(target);
  };

  self.remove = (consent) => {
     // each callback drops its target from self.callbacks[consent] by replacing the
     // list (see new()), so `targets` stays intact while we iterate
     const targets = self.callbacks[consent] || [];
     targets.forEach((e) => {
        // skip targets that are already resolved (e.g. registered twice)
        if (typeof e.callback === 'function') {
           // a failing message must not stop the others (or the caller's services)
           try {
              e.callback();
           } catch (error) {
              console.error('[ConsentMessage] callback error for "' + consent + '":', error);
           }
        }
     });
  };

  /**
   * Called by ConsentControl.init() once the stored consent is validated (and cleared
   * if outdated): create the messages that waited for this check.
   */
  self.consentChecked = () => {
     consentCheckDone = true;
     const queue = pending;
     pending = [];
     queue.forEach((args) => self.new(...args));
  };

  const waitForConsentCheck = (args) => {
     if (!pending.length) {
        // Fallback for pages without ConsentControl.init(): trust the stored consent
        // once the document is parsed. The extra tick lets an init() call in the same
        // task or in a DOMContentLoaded handler run first.
        const fallback = () => setTimeout(() => consentCheckDone || self.consentChecked(), 0);
        if (document.readyState === 'loading') {
           document.addEventListener('DOMContentLoaded', fallback, { once: true });
        } else {
           fallback();
        }
     }
     pending.push(args);
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

  window.deleteAllCookies = deleteAllCookies;
  window.loadScript = loadScript;
  window.getConsentControlCookie = getConsentControlCookie;
  window.setConsentControlCookie = setConsentControlCookie;
  window.getConsentVersion = getConsentVersion;
  window.clearConsentControlCookie = clearConsentControlCookie;
  window.ConsentControl = ConsentControl;
  window.ConsentMessage = ConsentMessage;

  exports.ConsentControl = ConsentControl;
  exports.ConsentMessage = ConsentMessage;
  exports.clearConsentControlCookie = clearConsentControlCookie;
  exports.deleteAllCookies = deleteAllCookies;
  exports.getConsentControlCookie = getConsentControlCookie;
  exports.getConsentVersion = getConsentVersion;
  exports.loadScript = loadScript;
  exports.setConsentControlCookie = setConsentControlCookie;

  Object.defineProperty(exports, '__esModule', { value: true });

  return exports;

})({});
