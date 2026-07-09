export const defaults = {
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
}