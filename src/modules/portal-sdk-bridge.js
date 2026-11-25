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
      if (plansEl && servers.length) {
        plansEl.setAttribute('data-live-servers-count', String(servers.length));
        sdkFactory.renderLiveServersStrip(plansEl.querySelector('.wrap') || plansEl, servers);
      }
    }).catch(function () { /* optional */ });
  }

  var isAccountPage = Boolean(document.querySelector('[data-sdk-vpn-panel]'));
  if (!isAccountPage) {
    sdkFactory.initCheckoutReturnPolling(sdk);
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

    var checkoutDialog = document.querySelector('dialog[data-checkout], #checkout-dialog, #checkout');
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
        var planInput = checkoutForm.querySelector('[name="plan"]:checked, [name="plan_code"], [name="plan"]');
        var promoInput = checkoutForm.querySelector('[name="promo"], [name="promo_code"]');
        var msgEl = checkoutForm.querySelector('[role="status"], .status, [data-checkout-message]');
        var returnUrl = new URL('./account.html', window.location.href).href;
        var cancelUrl = new URL('./index.html?status=cancelled', window.location.href).href;
        sdk.checkout({
          plan_code: planInput ? planInput.value : 'quarterly',
          provider: getKProvider(),
          promo_code: promoInput ? promoInput.value.trim() : null,
          return_url: returnUrl,
          cancel_url: cancelUrl
        }).then(function (res) {
          setStatus(msgEl, res && res.checkout && res.checkout.mode === 'mock' ? 'Confirm test payment to activate your VPN key.' : 'Redirecting to payment provider...');
          if (checkoutDialog && checkoutDialog.open && res && res.checkout && res.checkout.mode === 'mock') {
            checkoutDialog.close();
          }
          sdkFactory.handleCheckoutResponse(sdk, res);
        }).catch(function (err) {
          setStatus(msgEl, (err && err.message) || 'Checkout failed.');
        });
      }, true);
    }
  }

  var vpnPanel = document.querySelector('[data-sdk-vpn-panel]');
  if (!vpnPanel) return;

  if (sdk.mode === 'live') {
    if (!sdk.isAuthenticated()) {
      window.location.href = './login.html';
      return;
    }
    document.querySelectorAll('.prototype-note, .prototype-banner, [data-demo-banner], [data-demo-select], [data-preview-session]').forEach(function (el) {
      el.hidden = true;
    });
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
  var billingBody = document.querySelector('[data-sdk-billing]');
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
        }).then(renderDevices).catch(function (err) {
          setStatus(statusNote, (err && err.message) || 'Could not revoke device.');
        });
      });
      devicesBody.appendChild(tr);
    });
  }

  function renderServers(servers) {
    if (!serversBody) return;
    serversBody.innerHTML = '';
    if (!servers || !servers.length) {
      serversBody.innerHTML = '<tr><td colspan="4">No servers available for this subscription.</td></tr>';
      return;
    }
    servers.forEach(function (srv) {
      var tr = document.createElement('tr');
      tr.innerHTML = '<td></td><td></td><td></td><td></td>';
      tr.children[0].textContent = sdkFactory.formatServerLocation(srv);
      tr.children[1].textContent = sdkFactory.formatServerStatusAndLoad(srv);
      tr.children[2].textContent = srv.ping_ms ? srv.ping_ms + ' ms' : '—';
      tr.children[3].textContent = sdkFactory.formatServerProtocolsAndTags(srv);
      serversBody.appendChild(tr);
    });
  }

  function renderBilling(payments) {
    if (!billingBody) return;
    billingBody.innerHTML = '';
    if (!payments || !payments.length) {
      billingBody.innerHTML = '<tr><td colspan="4">No payments yet.</td></tr>';
      return;
    }
    payments.forEach(function (p) {
      var tr = document.createElement('tr');
      tr.innerHTML = '<td></td><td></td><td></td><td></td>';
      tr.children[0].textContent = p.paid_at ? new Date(p.paid_at).toLocaleDateString() : '—';
      tr.children[1].textContent = p.plan_code;
      tr.children[2].textContent = formatEur(p.final_amount_minor);
      tr.children[3].textContent = sdkFactory.formatPaymentProvider(p.provider) + ' · ' + sdkFactory.formatPaymentStatus(p.status);
      billingBody.appendChild(tr);
    });
  }

  function loadAccountData() {
    var ready = (!sdk.isAuthenticated() && sdk.mode === 'demo')
      ? sdk.login({ email: 'demo@kunivpn.com', password: 'demo-password' })
      : Promise.resolve();

    return ready.then(function () {
      return Promise.all([sdk.getMe(), sdk.getSubscription(), sdk.getBillingHistory()]);
    }).then(function (all) {
      var me = all[0];
      var subRes = all[1];
      var billRes = all[2];
      if (me && me.client) {
        vpnPanel.setAttribute('data-client-email', me.client.email || '');
        var profileCard = document.querySelector('.profile-card');
        if (profileCard) {
          var h3 = profileCard.querySelector('h3');
          var emailP = profileCard.querySelector('p');
          if (h3 && me.client.display_name) h3.textContent = me.client.display_name;
          if (emailP && me.client.email) emailP.textContent = me.client.email;
        }
        var profileNameInput = document.querySelector('#profile-name');
        if (profileNameInput && me.client.display_name) profileNameInput.value = me.client.display_name;
      }
      var payments = (billRes && billRes.payments) || [];
      renderBilling(payments);
      if (statusNote && sdk.mode === 'live') {
        statusNote.setAttribute('data-payments-count', String(payments.length));
      }
      var sub = subRes && subRes.subscription;
      if (sub) {
        var subBadge = document.querySelector('.overview-subscription .status-badge');
        var subDds = document.querySelectorAll('.overview-subscription .subscription-meta dd');
        if (subBadge) subBadge.textContent = sub.status;
        if (subDds[0]) subDds[0].textContent = sub.plan_name || sub.plan_code;
        if (subDds[1] && sub.expires_at) subDds[1].textContent = new Date(sub.expires_at).toLocaleDateString();
        if (subDds[2] && typeof sub.price_minor === 'number') subDds[2].textContent = formatEur(sub.price_minor);
      }
      accessKey = (sub && sub.access_key) || '';
      if (keyEl) keyEl.textContent = revealed ? accessKey : maskKey(accessKey);
      if (!accessKey) {
        renderServers([]);
        renderDevices({ limit: 5, devices: [] });
        return;
      }
      sdk.getBootstrap(accessKey).then(function (boot) {
        renderServers((boot && boot.servers) || []);
      }).catch(function (err) {
        if (err.code === 'KEY_EXPIRED') {
          setStatus(statusNote, 'Your VPN subscription has expired. Please renew your plan.');
        } else if (err.code === 'KEY_REVOKED') {
          setStatus(statusNote, 'Your VPN key has been revoked. Please contact support.');
        } else if (err.code === 'DEVICE_LIMIT_REACHED' || err.status === 409) {
          setStatus(statusNote, 'Device limit reached (5/5). Please revoke one of your connected devices below.');
          var errDevices = err.payload && err.payload.error && err.payload.error.devices;
          if (Array.isArray(errDevices)) renderDevices({ limit: 5, devices: errDevices });
        } else {
          setStatus(statusNote, (err && err.message) || 'Unable to load VPN servers.');
        }
      });
      sdk.getDevices(accessKey).then(renderDevices).catch(function () { /* ignore */ });
    }).catch(function (err) {
      setStatus(statusNote, (err && err.message) || 'Unable to load VPN access data.');
    });
  }

  loadAccountData();
  sdkFactory.initCheckoutReturnPolling(sdk, {
    statusEl: statusNote,
    onPaid: function () {
      loadAccountData();
    }
  });

  var profileForm = document.querySelector('[data-profile-form], form[data-form="profile"]');
  if (profileForm && sdk.mode === 'live') {
    profileForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var nameInput = profileForm.querySelector('[name="display_name"], [name="profile-name"], [name="name"]');
      sdk.updateProfile({ display_name: nameInput ? nameInput.value.trim() : '' }).then(function () {
        setStatus(profileForm.querySelector('[data-form-message]') || statusNote, 'Profile updated.');
      }).catch(function (err) {
        setStatus(profileForm.querySelector('[data-form-message]') || statusNote, (err && err.message) || 'Update failed.');
      });
    }, true);
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
      }).catch(function (err) {
        setStatus(statusNote, (err && err.message) || 'Password update failed.');
      });
    });
  }

  var logoutBtn = document.querySelector('[data-logout], [data-signout]');
  if (logoutBtn && sdk.mode === 'live') {
    logoutBtn.addEventListener('click', function (e) {
      e.preventDefault();
      sdk.logout().then(function () { window.location.href = './login.html'; });
    }, true);
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
      }).catch(function (err) {
        setStatus(statusNote, (err && err.message) || 'Support request failed.');
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
