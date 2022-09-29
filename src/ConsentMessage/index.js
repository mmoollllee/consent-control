import { extend, toLocation, template, getConsentControlCookie } from '../lib/index'

import { defaults } from './defaults'

window.ConsentMessage = {
   callbacks: {}
};
const self = window.ConsentMessage;

export const ConsentMessage = (consent, options = {}, target, srcName, callback = () => {
   target.setAttribute('src', target.getAttribute('data-src'));
   removeConsentMessage(target)
}) => {
   self.options = extend(true, defaults, options)

   self.status = [];

   if (consent && getConsentControlCookie(consent)) {
      callback()
      removeConsentMessage(target)
      return
   } else {
      self.callbacks[target] = function() {
         callback()
         removeConsentMessage(target)
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
   wrapper.querySelector('button.confirm').addEventListener('click', self.runConsentMessageCallback(consent));

}

self.runConsentMessageCallback = (target) => {
   console.log(target)
}

window.ConsentMessage = extend(true, window.ConsentMessage, ConsentMessage);


const removeConsentMessage = (target) => {
   if (target.tagName === 'IFRAME') {
      target = target.parentNode
   }
   const messageDiv = target.querySelector('.consent-message');
   if (messageDiv) {
      messageDiv.remove()
   }
}