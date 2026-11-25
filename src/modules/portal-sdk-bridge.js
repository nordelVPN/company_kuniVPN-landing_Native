'use strict';

var sdkFactory = require('./vpn-portal-sdk');

function initPortalSdkBridge() {
  var sdk = sdkFactory.createVpnPortalSdk({ brandSlug: 'kuni' });

  function setStatus(el, msg) {
    if (!el) return;
    el.hidden = false;
    el.textContent = msg;
  }

  function formatEur(minor) {
    var euros = (minor || 0) / 100;
    return '€' + (Number.isInteger(euros) ? String(euros) : euros.toFixed(2));
  }

  if (sdk.mode === 'live' && document.querySelector('#plans')) {
    sdk.getPublicPlans().then(function (res) {
      ((res && res.plans) || []).forEach(function (plan) {
        var btn = document.querySelector('[data-open-checkout="' + plan.plan_code + '"]');
        var card = btn && btn.closest('article');
        var priceEl = card && card.querySelector('.price, strong');
        if (priceEl) priceEl.textContent = formatEur(plan.price_minor);
      });
    }).catch(function () { /* keep static fallback */ });

    sdk.getPublicServersCatalog().then(function (res) {
      var servers = (res && (res.servers || res.locations || res.data)) || [];
      var plansEl = document.querySelector('#plans');
      if (plansEl && servers.length) plansEl.setAttribute('data-live-servers-count', String(servers.length));
    }).catch(function () { /* optional */ });
  }

  if (sdk.mode === 'live') {
    var loginForm = document.querySelector('#login form, form[data-form="login"]');
    if (loginForm) {
      loginForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var emailInput = loginForm.querySelector('input[type="email"]');
        var passInput = loginForm.querySelector('input[type="password"]');
        var msgEl = loginForm.querySelector('[role="status"], .status');
        sdk.login({
          email: emailInput ? emailInput.value.trim() : '',
          password: passInput ? passInput.value : ''
        }).then(function () {
          setStatus(msgEl, 'Signed in. Redirecting...');
          window.location.href = './account.html';
        }).catch(function (err) {
          setStatus(msgEl, (err && err.message) || 'Sign in failed.');
        });
      }, true);
    }

    var regForm = document.querySelector('form[data-form="register"], form[data-form="create-account"]');
    if (regForm) {
      regForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var emailInput = regForm.querySelector('input[type="email"]');
        var passInputs = regForm.querySelectorAll('input[type="password"]');
        var msgEl = regForm.querySelector('[role="status"], .status');
        var pass = passInputs[0] ? passInputs[0].value : '';
        var confirm = passInputs[1] ? passInputs[1].value : pass;
        sdk.register({
          email: emailInput ? emailInput.value.trim() : '',
          password: pass,
          password_confirmation: confirm
        }).then(function () {
          setStatus(msgEl, 'Account created. Redirecting...');
          window.location.href = './account.html';
        }).catch(function (err) {
          setStatus(msgEl, (err && err.message) || 'Registration failed.');
        });
      }, true);
    }

    var forgotForm = document.querySelector('form[data-form="forgot"], form[data-form="forgot-password"]');
    if (forgotForm) {
      var params = new URLSearchParams(window.location.search || '');
      var token = params.get('token');
      forgotForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var msgEl = forgotForm.querySelector('[role="status"], .status');
        if (token) {
          var passInputs = forgotForm.querySelectorAll('input[type="password"]');
          var p1 = passInputs[0] ? passInputs[0].value : '';
          var p2 = passInputs[1] ? passInputs[1].value : p1;
          sdk.resetPassword({ token: token, password: p1, password_confirmation: p2 }).then(function () {
            setStatus(msgEl, 'Password reset. Redirecting...');
            window.location.href = './login.html';
          }).catch(function (err) {
            setStatus(msgEl, (err && err.message) || 'Reset failed.');
          });
        } else {
          var emailInput = forgotForm.querySelector('input[type="email"]');
          sdk.forgotPassword(emailInput ? emailInput.value.trim() : '').then(function (res) {
            setStatus(msgEl, (res && res.message) || 'If an account exists, reset instructions have been sent.');
          }).catch(function (err) {
            setStatus(msgEl, (err && err.message) || 'Request failed.');
          });
        }
      }, true);
    }

    sdkFactory.initCheckoutReturnPolling(sdk);

    var checkoutDialog = document.querySelector('dialog[data-checkout], #checkout-dialog');
    var checkoutForm = checkoutDialog && checkoutDialog.querySelector('form');
    if (checkoutForm) {
      var getKProvider = function () { return null; };
      var kProviderHost = checkoutForm.querySelector('[data-payment-providers]');
      if (!kProviderHost) {
        kProviderHost = document.createElement('div');
        kProviderHost.className = 'payment-providers';
        kProviderHost.setAttribute('data-payment-providers', '');
        kProviderHost.hidden = true;
        var kSubmit = checkoutForm.querySelector('button[type="submit"]');
        if (kSubmit && kSubmit.parentNode) {
          kSubmit.parentNode.insertBefore(kProviderHost, kSubmit);
        } else {
          checkoutForm.appendChild(kProviderHost);
        }
      }
      sdkFactory.mountPaymentProviderSelector(sdk, kProviderHost).then(function (getter) {
        if (typeof getter === 'function') getKProvider = getter;
      });

      checkoutForm.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!sdk.isAuthenticated()) {
          window.location.href = './login.html';
          return;
        }
        var planInput = checkoutForm.querySelector('[name="plan"]:checked, [name="plan_code"]');
        var promoInput = checkoutForm.querySelector('[name="promo"], [name="promo_code"]');
        var msgEl = checkoutForm.querySelector('[role="status"], .status');
        var baseUrl = window.location.origin + window.location.pathname;
        sdk.checkout({
          plan_code: planInput ? planInput.value : 'quarterly',
          provider: getKProvider(),
          promo_code: promoInput ? promoInput.value.trim() : null,
          return_url: baseUrl,
          cancel_url: baseUrl + '?status=cancelled'
        }).then(function (res) {
          var target = res && res.checkout && res.checkout.checkout_url;
          setStatus(msgEl, 'Redirecting to payment provider...');
          window.location.href = target || './account.html';
        }).catch(function (err) {
          setStatus(msgEl, (err && err.message) || 'Checkout failed.');
        });
      }, true);
    }
  }

  var vpnPanel = document.querySelector('[data-sdk-vpn-panel]');
  if (!vpnPanel) return;

  if (sdk.mode === 'live' && !sdk.isAuthenticated()) {
    window.location.href = './login.html';
    return;
  }

  var accessKey = '';
  var revealed = false;

  function maskKey(k) {
    return k && k.length > 12 ? k.slice(0, 10) + '••••••••••••' + k.slice(-4) : '••••••••';
  }

  var keyEl = vpnPanel.querySelector('[data-sdk-vpn-key]');
  var serversBody = vpnPanel.querySelector('[data-sdk-servers]');
  var devicesBody = vpnPanel.querySelector('[data-sdk-devices]');
  var devicesCount = vpnPanel.querySelector('[data-sdk-devices-count]');
  var statusNote = vpnPanel.querySelector('[data-sdk-status]');

  function renderDevices(res) {
    var devices = (res && res.devices) || [];
    var limit = (res && res.limit) || 5;
    if (devicesCount) devicesCount.textContent = devices.length + ' / ' + limit;
    if (!devicesBody) return;
    devicesBody.innerHTML = '';
    if (!devices.length) {
      devicesBody.innerHTML = '<tr><td colspan="4">No devices connected.</td></tr>';
      return;
    }
    devices.forEach(function (dev) {
      var tr = document.createElement('tr');
      tr.innerHTML = '<td></td><td></td><td></td><td><button type="button" class="secondary">Revoke</button></td>';
      tr.children[0].textContent = dev.device_name || dev.device_uid;
      tr.children[1].textContent = dev.platform || 'unknown';
      tr.children[2].textContent = dev.last_seen_at ? new Date(dev.last_seen_at).toLocaleDateString() : '—';
      tr.querySelector('button').addEventListener('click', function () {
        sdk.revokeDevice(accessKey, dev.device_uid).then(function () {
          return sdk.getDevices(accessKey);
        }).then(renderDevices);
      });
      devicesBody.appendChild(tr);
    });
  }

  var ready = (!sdk.isAuthenticated() && sdk.mode === 'demo')
    ? sdk.login({ email: 'demo@kunivpn.com', password: 'demo-password' })
    : Promise.resolve();

  ready.then(function () {
    return Promise.all([sdk.getMe(), sdk.getSubscription(), sdk.getBillingHistory()]);
  }).then(function (all) {
    var me = all[0];
    var subRes = all[1];
    var billRes = all[2];
    if (me && me.client && sdk.mode === 'live') {
      vpnPanel.setAttribute('data-client-email', me.client.email || '');
      document.querySelectorAll('.prototype-banner, [data-demo-banner]').forEach(function (el) { el.hidden = true; });
    }
    if (billRes && billRes.payments && statusNote && sdk.mode === 'live') {
      statusNote.setAttribute('data-payments-count', String(billRes.payments.length));
    }
    accessKey = (subRes && subRes.subscription && subRes.subscription.access_key) || '';
    if (keyEl) keyEl.textContent = maskKey(accessKey);
    if (!accessKey) return [null, null];
    return Promise.all([sdk.getBootstrap(accessKey), sdk.getDevices(accessKey)]);
  }).then(function (results) {
    var boot = results && results[0];
    var devRes = results && results[1];
    if (serversBody && boot) {
      serversBody.innerHTML = '';
      ((boot && boot.servers) || []).forEach(function (srv) {
        var tr = document.createElement('tr');
        tr.innerHTML = '<td></td><td></td><td></td><td></td>';
        tr.children[0].textContent = srv.country_code + ' — ' + srv.name + (srv.is_recommended ? ' ★' : '');
        tr.children[1].textContent = srv.status;
        tr.children[2].textContent = srv.ping_ms ? srv.ping_ms + ' ms' : '—';
        tr.children[3].textContent = (srv.protocols || []).map(function (p) { return p.type; }).join(', ');
        serversBody.appendChild(tr);
      });
    }
    if (devRes) renderDevices(devRes);
  }).catch(function (err) {
    setStatus(statusNote, (err && err.message) || 'Unable to load VPN access data.');
  });

  var profileForm = document.querySelector('[data-profile-form]');
  if (profileForm && sdk.mode === 'live') {
    profileForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var nameInput = profileForm.querySelector('[name="display_name"], [name="name"]');
      sdk.updateProfile({ display_name: nameInput ? nameInput.value.trim() : '' }).then(function () {
        setStatus(statusNote, 'Profile updated.');
      });
    });
  }

  var passForm = document.querySelector('[data-password-form]');
  if (passForm) {
    passForm.addEventListener('submit', function (e) {
      e.preventDefault();
      sdk.changePassword({
        current_password: passForm.current_password.value,
        password: passForm.password.value,
        password_confirmation: passForm.password_confirmation.value
      }).then(function () {
        passForm.reset();
        setStatus(statusNote, 'Password updated.');
      });
    });
  }

  var logoutBtn = document.querySelector('[data-logout]');
  if (logoutBtn && sdk.mode === 'live') {
    logoutBtn.addEventListener('click', function () {
      sdk.logout().then(function () { window.location.href = './login.html'; });
    });
  }

  var logoutAllBtn = document.querySelector('[data-logout-all]');
  if (logoutAllBtn) {
    logoutAllBtn.addEventListener('click', function () {
      sdk.logoutAll().then(function () { window.location.href = './login.html'; });
    });
  }

  var supportForm = document.querySelector('[data-support-form]');
  if (supportForm) {
    supportForm.addEventListener('submit', function (e) {
      e.preventDefault();
      sdk.createSupportTicket({
        subject: supportForm.subject.value.trim(),
        message: supportForm.message.value.trim()
      }).then(function () {
        supportForm.reset();
        setStatus(statusNote, 'Support request submitted.');
      });
    });
  }

  var revBtn = vpnPanel.querySelector('[data-sdk-key-reveal]');
  if (revBtn) {
    revBtn.addEventListener('click', function () {
      revealed = !revealed;
      if (keyEl) keyEl.textContent = revealed ? accessKey : maskKey(accessKey);
      revBtn.textContent = revealed ? 'Hide' : 'Show';
    });
  }

  var copyBtn = vpnPanel.querySelector('[data-sdk-key-copy]');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      if (navigator.clipboard && accessKey) {
        navigator.clipboard.writeText(accessKey).then(function () { setStatus(statusNote, 'VPN key copied.'); });
      }
    });
  }
}

module.exports = { initPortalSdkBridge: initPortalSdkBridge };
