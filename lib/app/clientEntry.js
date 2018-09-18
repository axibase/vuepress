/* global BASE_URL, GA_ID, ga, SW_ENABLED, SC_ID, SC_SEC */

import '@temp/polyfill'
import { createApp } from './app'
import { register } from 'register-service-worker'

const { app, router, base } = createApp()

// Google analytics integration
if (process.env.NODE_ENV === 'production' && GA_ID) {
  (function (i, s, o, g, r, a, m) {
    i['GoogleAnalyticsObject'] = r
    i[r] = i[r] || function () {
      (i[r].q = i[r].q || []).push(arguments)
    }
    i[r].l = 1 * new Date()
    a = s.createElement(o)
    m = s.getElementsByTagName(o)[0]
    a.async = 1
    a.src = g
    m.parentNode.insertBefore(a, m)
  })(window, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga')

  ga('create', GA_ID, 'auto')
  ga('send', 'pageview')

  router.afterEach(function (to, from) {
    const baseUrl = base.replace(/\/$/, '')
    ga('set', 'location', baseUrl + from.fullPath)
    ga('set', 'page', baseUrl + to.fullPath)
    ga('send', 'pageview')
  })
}

// StatCounter
if (process.env.NODE_ENV === 'production' && SC_ID && SC_SEC) {
  router.afterEach(function (from, to) {
    Object.assign(window, {
      sc_project: parseInt(SC_ID, 10),
      sc_security: SC_SEC,
      sc_invisible: 1
    })
    let scScript = document.querySelector('#sc-script')
    if (scScript != null) {
      scScript.parentNode.removeChild(scScript)
    }
    scScript = document.createElement('script')
    scScript.id = 'sc-script'
    scScript.async = true
    var scJsHost = ((document.location.protocol === 'https:') ? 'https://secure.' : 'http://www.')
    scScript.src = scJsHost + 'statcounter.com/counter/counter_xhtml.js'
    document.body.appendChild(scScript)
  })
}
router.onReady(() => {
  app.$mount('#app')

  // Register service worker
  if (process.env.NODE_ENV === 'production' &&
    SW_ENABLED &&
    window.location.protocol === 'https:') {
    register(`${BASE_URL}service-worker.js`, {
      ready () {
        console.log('[vuepress:sw] Service worker is active.')
        app.$refs.layout.$emit('sw-ready')
      },
      cached () {
        console.log('[vuepress:sw] Content has been cached for offline use.')
        app.$refs.layout.$emit('sw-cached')
      },
      updated () {
        console.log('[vuepress:sw] Content updated.')
        app.$refs.layout.$emit('sw-updated')
      },
      offline () {
        console.log('[vuepress:sw] No internet connection found. App is running in offline mode.')
        app.$refs.layout.$emit('sw-offline')
      },
      error (err) {
        console.error('[vuepress:sw] Error during service worker registration:', err)
        app.$refs.layout.$emit('sw-error', err)
        if (GA_ID) {
          ga('send', 'exception', {
            exDescription: err.message,
            exFatal: false
          })
        }
      }
    })
  }
})

var padding = 0;

function scrollToTarget(e) {
  var hash = location.hash;
  var link = document.querySelector('.ref-link[href="'+hash+'"]');
  if (link) {
    e.preventDefault();
    if (!padding) {
      var navbarStyle  = getComputedStyle(document.querySelector(".navbar"));
      padding = parseFloat(navbarStyle.height) + 20;
    }
    window.scrollBy(0, link.getBoundingClientRect().top - padding);
  }
}

window.addEventListener("load", scrollToTarget);
window.addEventListener("hashchange", scrollToTarget);