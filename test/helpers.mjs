import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { JSDOM, VirtualConsole } from 'jsdom'
import { rollup } from 'rollup'

export const HOST = 'www.example.com'

let code

/**
 * The bundle under test: built from src/ in memory, or a built file given in
 * CC_BUNDLE (e.g. `CC_BUNDLE=dist/bundle.min.js npm test`).
 */
const bundle = async () => {
   if (!code) {
      if (process.env.CC_BUNDLE) {
         code = await readFile(process.env.CC_BUNDLE, 'utf8')
      } else {
         const build = await rollup({
            input: fileURLToPath(new URL('../src/index.js', import.meta.url)),
            onwarn: (warning, warn) => warning.code === 'MISSING_NAME_OPTION_FOR_IIFE_EXPORT' || warn(warning),
         })
         const { output } = await build.generate({ format: 'iife' })
         code = output[0].code
      }
   }
   return code
}

/**
 * A fresh page with the bundle loaded.
 * @param {Object} setup
 * @param {String} setup.body       markup of <body>
 * @param {Object} setup.cookies    cookies set before the bundle runs, as the banner sets them
 * @param {Object} setup.storage    localStorage entries
 * @param {Function} t              node:test context, closes the window afterwards
 */
export const page = async (t, { body = '', cookies = {}, storage = {} } = {}) => {
   const result = {
      errors: [],   // uncaught exceptions (e.g. in click handlers)
      logged: [],   // console.error output of the page
      reloads: 0,   // location.reload() calls
      events: [],   // consent-updated event details
   }

   const virtualConsole = new VirtualConsole()
   virtualConsole.on('jsdomError', (error) => {
      // jsdom can't navigate: a reload shows up as this error
      if (/^Not implemented: navigation/.test(error.message)) {
         result.reloads++
      } else {
         result.errors.push(error.message)
      }
   })
   virtualConsole.on('error', (...args) => result.logged.push(args.map(String).join(' ')))

   const dom = new JSDOM(`<!DOCTYPE html><html><head></head><body>${body}</body></html>`, {
      url: `https://${HOST}/`,
      runScripts: 'dangerously',
      virtualConsole,
   })
   const { window } = dom
   t.after(() => window.close())

   window.alert = () => {}
   for (const [name, value] of Object.entries(cookies)) {
      window.document.cookie = `${name}=${value}; path=/; domain=${HOST}`
   }
   for (const [key, value] of Object.entries(storage)) {
      window.localStorage.setItem(key, value)
   }
   // copied into this realm, so assert.deepEqual can compare it
   window.addEventListener('consent-updated', (e) => result.events.push(JSON.parse(JSON.stringify(e.detail))))

   window.eval(await bundle())

   const $ = (selector) => window.document.querySelector(selector)

   return Object.assign(result, {
      window,
      document: window.document,
      $,
      ConsentControl: window.ConsentControl,
      ConsentMessage: window.ConsentMessage,
      click: (selector) => $(selector).click(),
      setSwitch: (value, checked) => {
         $(`#consent-control-banner input[value="${value}"]`).checked = checked
      },
      consent: () => {
         const consent = window.getConsentControlCookie()
         return Array.isArray(consent) ? [...consent] : consent
      },
      cookieNames: () => window.document.cookie.split('; ').filter(Boolean).map((c) => c.split('=')[0]).sort(),
      tick: (ms = 10) => new Promise((resolve) => setTimeout(resolve, ms)),
   })
}

/**
 * Count how often the src attribute of an element gets set (each time reloads an iframe).
 */
export const countSrcWrites = (element) => {
   const writes = []
   const setAttribute = element.setAttribute
   element.setAttribute = function (name, value) {
      if (name === 'src') {
         writes.push(value)
      }
      return setAttribute.call(this, name, value)
   }
   return writes
}

export const categories = {
   necessary: { disabled: true, checked: true, label: 'Necessary' },
   functional: { label: 'Functional' },
}

export const REOPEN = '<button type="button" id="reopen" class="consent-control--open">Cookie settings</button>'
