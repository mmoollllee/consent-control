import { extend, toLocation, template, getConsentControlCookie } from '../lib/index'

import { defaults } from './defaults'

const ConsentMessage = {
   callbacks: {}
}

const self = ConsentMessage;

self.new = (consent, target, options = {}, srcName, callback = () => {
   target.setAttribute('src', target.getAttribute('data-src'));
   removeConsentMessage(target)
}) => {
   self.options = extend(true, defaults, options)

   // if consent is already given, else bind callback to target
   if (consent && getConsentControlCookie(consent)) {
      callback()
      removeConsentMessage(target)
      return
   } else {
      target.callback = function() {
         callback()
         removeConsentMessage(target)
         delete target.callback
      }
   }

   // Get srcName
   if (!srcName) {
      const src = target.getAttribute('data-src');
      srcName = target.getAttribute('data-src-name') ?? toLocation(src).hostname;
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

      // Insert .consent-message with button.confirm
      wrapper.insertAdjacentHTML(
         'afterbegin',
         template(self, 'main').replace(
            /{\w+}/g, srcName
         )
      )
   }

   // bind callback event
   wrapper.querySelector('button.confirm').addEventListener('click', () => target.callback());
   
   // add target to consent groups' instances
   if ( !self.callbacks[consent] ) {
      self.callbacks[consent] = []
   }
   self.callbacks[consent].push(target)
}

self.remove = (consent) => {
   const targets = self.callbacks[consent] || []
   targets.forEach((e) => {
      e.callback()
   })
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