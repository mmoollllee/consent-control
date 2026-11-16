import { extend, toLocation, template, getConsentControlCookie, consentVersionOk } from '../lib/index'

import { defaults } from './defaults'

const ConsentMessage = {
   callbacks: {}
}

const self = ConsentMessage;

// Messages created while a stored consent was not validated by ConsentControl.init()
// yet: init() may still discard it (e.g. after a version bump). See consentChecked().
let pending = []
let consentCheckDone = false

self.new = (
   consent, 
   target, 
   options = {}, 
   srcName, 
   callback = () => {
      // local variable: `target` must stay the registered element (see target.callback)
      const iframe = target.tagName === 'IFRAME' ? target : target.querySelector('iframe');
      iframe.setAttribute('src', iframe.getAttribute('data-src'));
      removeConsentMessage(iframe)
   }
) => {
   // stored consent not validated yet: wait for ConsentControl.init()
   if (consent && !consentCheckDone && getConsentControlCookie(consent)) {
      waitForConsentCheck([consent, target, options, srcName, callback])
      return
   }

   // copy the defaults, so options stay local to this message
   self.options = extend(true, {}, defaults, options)

   // if consent is already given, else bind callback to target
   if (consent && getConsentControlCookie(consent) && consentVersionOk()) {
      callback()
      removeConsentMessage(target)
      return
   } else {
      target.callback = function() {
         callback()
         removeConsentMessage(target)
         delete target.callback
         // resolved: drop target from its consent group, so remove() won't call it again
         if (self.callbacks[consent]) {
            self.callbacks[consent] = self.callbacks[consent].filter((e) => e !== target)
         }
      }
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
         )
      }
   }

   // bind callback event (custom markup may come without a button)
   const button = wrapper.querySelector('button.confirm')
   if (button) {
      // the button may outlive the message (custom markup): ignore clicks once resolved
      button.addEventListener('click', () => target.callback && target.callback());
   }
   
   // add target to consent groups' instances
   if ( !self.callbacks[consent] ) {
      self.callbacks[consent] = []
   }
   self.callbacks[consent].push(target)
}

self.remove = (consent) => {
   // each callback drops its target from self.callbacks[consent] by replacing the
   // list (see new()), so `targets` stays intact while we iterate
   const targets = self.callbacks[consent] || []
   targets.forEach((e) => {
      // skip targets that are already resolved (e.g. registered twice)
      if (typeof e.callback === 'function') {
         // a failing message must not stop the others (or the caller's services)
         try {
            e.callback()
         } catch (error) {
            console.error('[ConsentMessage] callback error for "' + consent + '":', error)
         }
      }
   })
}

/**
 * Called by ConsentControl.init() once the stored consent is validated (and cleared
 * if outdated): create the messages that waited for this check.
 */
self.consentChecked = () => {
   consentCheckDone = true
   const queue = pending
   pending = []
   queue.forEach((args) => self.new(...args))
}

const waitForConsentCheck = (args) => {
   if (!pending.length) {
      // Fallback for pages without ConsentControl.init(): trust the stored consent
      // once the document is parsed. The extra tick lets an init() call in the same
      // task or in a DOMContentLoaded handler run first.
      const fallback = () => setTimeout(() => consentCheckDone || self.consentChecked(), 0)
      if (document.readyState === 'loading') {
         document.addEventListener('DOMContentLoaded', fallback, { once: true })
      } else {
         fallback()
      }
   }
   pending.push(args)
}

const removeConsentMessage = (target) => {
   if (target.tagName === 'IFRAME') {
      target = target.parentNode
   }
   const messageDiv = target.querySelector('.consent-message');
   if (messageDiv) {
      messageDiv.remove()
   }
}

export {ConsentMessage}