'use strict';

var sdkFactory = require('./vpn-portal-sdk');
var QRCore = require('qrcode/lib/core/qrcode');
function createQrMatrix(text) {
  return QRCore.create(text, { errorCorrectionLevel: 'M' }).modules;
}

function initPortalSdkBridge() {
  var sdk = sdkFactory.createVpnPortalSdk({ brandSlug: 'kuni' });
  sdkFactory.syncAccountNavLinks(sdk);
  var siteConfigPromise = sdk.getSiteConfig();
  var KUNI_DEFAULT_PLANS = [
    { plan_code: 'trial', name: 'Trial (1 month)', price_minor: 100 },
    { plan_code: 'monthly', name: '1 Month', price_minor: 700 },
    { plan_code: 'quarterly', name: '3 Months', price_minor: 1500 },
    { plan_code: 'yearly', name: '12 Months', price_minor: 5500 }
  ];
  var cachedPlans = KUNI_DEFAULT_PLANS.slice();
  var currentSiteConfig = null;
  var cachedClientEmail = '';
  function syncKuniWishlistBotUrls(cfg) {
    if (!cfg || !sdkFactory.isSiteInWishlistMode(cfg)) return;
    var lang = sdkFactory.getCurrentSiteLanguage();
    document.querySelectorAll('[data-open-checkout]').forEach(function (el) {
      var planCode = el.getAttribute('data-open-checkout') || '';
      el.setAttribute('data-wishlist-bot-url', sdkFactory.buildWishlistBotUrl(cfg, { planCode: planCode, language: lang }));
    });
  }
  siteConfigPromise.then(function (cfg) {
    currentSiteConfig = cfg;
    var isWishlist = sdkFactory.isSiteInWishlistMode(cfg);
    document.documentElement.dataset.launchMode = isWishlist ? 'wishlist_only' : 'live';
    if (isWishlist) {
      var openDlg = document.querySelector('dialog[data-checkout], #checkout-dialog, #checkout');
      if (openDlg && openDlg.open) openDlg.close();
      syncKuniWishlistBotUrls(cfg);
    }
  });
  document.addEventListener('languagechange', function () {
    if (currentSiteConfig) syncKuniWishlistBotUrls(currentSiteConfig);
  });

  document.addEventListener('click', function (e) {
    var btn = e.target && e.target.closest && e.target.closest('[data-open-checkout]');
    if (!btn) return;
    var planCode = btn.getAttribute('data-open-checkout') || '';
    if (currentSiteConfig) {
      if (!sdkFactory.isSiteInWishlistMode(currentSiteConfig)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      sdkFactory.openWishlistBot(currentSiteConfig, {
        planCode: planCode,
        language: sdkFactory.getCurrentSiteLanguage()
      });
      return;
    }
    e.preventDefault();
    e.stopImmediatePropagation();
    siteConfigPromise.then(function (cfg) {
      if (sdkFactory.isSiteInWishlistMode(cfg)) {
        sdkFactory.openWishlistBot(cfg, {
          planCode: planCode,
          language: sdkFactory.getCurrentSiteLanguage()
        });
      } else {
        btn.click();
      }
    });
  }, true);

  function findKuniPlan(code) {
    var clean = String(code || '').trim();
    return cachedPlans.find(function (p) { return p.plan_code === clean; }) ||
      KUNI_DEFAULT_PLANS.find(function (p) { return p.plan_code === clean; }) ||
      KUNI_DEFAULT_PLANS[2];
  }

  function uiMsg() {
    return sdkFactory.getPortalUiMessages();
  }

  function isValidEmail(val) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val || '').trim());
  }

  function setStatus(el, msg, type, options) {
    if (!el) return;
    sdkFactory.setPortalStatus(el, msg, type || 'info', options);
  }

  function formatEur(minor) {
    var euros = (minor || 0) / 100;
    return '€' + (Number.isInteger(euros) ? String(euros) : euros.toFixed(2));
  }

  if (document.querySelector('#plans')) {
    document.querySelectorAll('[data-open-checkout]').forEach(function (btn) {
      var code = btn.getAttribute('data-open-checkout');
      var card = btn.closest('article');
      var titleEl = card && card.querySelector('h3');
      if (code) cachedPlans.push({ plan_code: code, name: titleEl ? titleEl.textContent.trim() : code });
    });

    if (sdk.mode === 'live') {
      sdk.getPublicPlans().then(function (res) {
        var plans = (res && res.plans) || [];
        if (plans.length) {
          cachedPlans = plans.map(function (p) { return { plan_code: p.plan_code, name: p.name || p.plan_code }; });
        }
        plans.forEach(function (plan) {
          var btn = document.querySelector('[data-open-checkout="' + plan.plan_code + '"]');
          var card = btn && btn.closest('article');
          var priceEl = card && card.querySelector('.price, strong');
          if (priceEl) priceEl.textContent = formatEur(plan.price_minor);
        });
      }).catch(function () { /* keep static fallback */ });
    }

    siteConfigPromise.then(function (cfg) {
      if (!sdkFactory.isSiteServersEnabled(cfg)) {
        var strip = document.querySelector('[data-live-servers-strip]');
        if (strip) strip.hidden = true;
        return;
      }
      if (sdk.mode !== 'live') return;
      sdk.getPublicServersCatalog().then(function (res) {
        var servers = (res && (res.servers || res.locations || res.data)) || [];
        var plansEl = document.querySelector('#plans');
        if (plansEl && servers.length) {
          plansEl.setAttribute('data-live-servers-count', String(servers.length));
          sdkFactory.renderLiveServersStrip(plansEl.querySelector('.wrap') || plansEl, servers);
        }
      }).catch(function () { /* optional */ });
    });
  }

  var isAccountPage = Boolean(document.querySelector('[data-sdk-vpn-panel]'));
  if (!isAccountPage) {
    sdkFactory.initCheckoutReturnPolling(sdk);
  }

  // TASK-027: Pre-launch / Join Wishlist banner intentionally omitted on create-account.html.

  if (sdk.mode === 'live') {
    document.querySelectorAll('.prototype-note').forEach(function (el) { el.hidden = true; });
    var loginForm = document.querySelector('#login form, form[data-form="login"]');
    if (loginForm) {
      sdkFactory.bindFormValidationClear(loginForm);
      var lMsgEl = loginForm.querySelector('[data-portal-status], [data-form-message], [role="status"], .status');
      var lBtn = loginForm.querySelector('button[type="submit"]');
      loginForm.addEventListener('submit', function (e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        sdkFactory.clearFieldErrors(loginForm);
        var emailInput = loginForm.querySelector('input[type="email"]');
        var passInput = loginForm.querySelector('input[type="password"]');
        var email = emailInput ? emailInput.value.trim() : '';
        var password = passInput ? passInput.value : '';
        var emailKey = (emailInput && emailInput.name) || 'email';
        var passKey = (passInput && passInput.name) || 'password';
        var fieldErrs = {};
        if (!isValidEmail(email)) fieldErrs[emailKey] = uiMsg().invalidEmail;
        if (!password) fieldErrs[passKey] = uiMsg().requiredField;
        if (Object.keys(fieldErrs).length) {
          sdkFactory.setFieldErrors(loginForm, fieldErrs);
          setStatus(lMsgEl, Object.values(fieldErrs)[0], 'error');
          return;
        }
        setStatus(lMsgEl, uiMsg().loading, 'loading', { scroll: false });
        sdkFactory.withFormBusy(loginForm, lBtn, function () {
          return sdk.login({ email: email, password: password }).then(function () {
            setStatus(lMsgEl, 'Signed in. Redirecting...', 'success');
            window.location.href = './account.html';
          }).catch(function (err) {
            if (err && err.details) {
              sdkFactory.setFieldErrors(loginForm, err.details);
            } else if (err && err.status === 401) {
              sdkFactory.setFieldErrors(loginForm, {
                [emailKey]: sdkFactory.formatPortalApiError(err, uiMsg().unauthorized),
                [passKey]: ' '
              }, { focus: false });
            }
            setStatus(lMsgEl, sdkFactory.formatPortalApiError(err, 'Sign in failed.'), 'error');
          });
        });
      }, true);
    }

    var regForm = document.querySelector('form[data-form="register"], form[data-form="create-account"]');
    if (regForm) {
      sdkFactory.bindFormValidationClear(regForm);
      var regParams = new URLSearchParams(window.location.search || '');
      var handoff = sdk.consumePlanSelectionHandoff() || {};
      var selectedPlanCode = String(regParams.get('plan') || handoff.planCode || '').trim();
      var preEmailInput = regForm.querySelector('input[type="email"]');
      if (handoff.email && preEmailInput && !preEmailInput.value) {
        preEmailInput.value = handoff.email;
      }
      if (selectedPlanCode) {
        sdkFactory.mountSelectedPlanBanner(regForm, findKuniPlan(selectedPlanCode));
      }
      var rMsgEl = regForm.querySelector('[data-portal-status], [data-form-message], [role="status"], .status');
      var rBtn = regForm.querySelector('button[type="submit"]');
      regForm.addEventListener('submit', function (e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        sdkFactory.clearFieldErrors(regForm);
        var emailInput = regForm.querySelector('input[type="email"]');
        var nameInput = regForm.querySelector('input[name="display_name"]');
        var passInputs = regForm.querySelectorAll('input[type="password"]');
        var termsEl = regForm.querySelector('input[name="accept_terms"]');
        var email = emailInput ? emailInput.value.trim() : '';
        var pass = passInputs[0] ? passInputs[0].value : '';
        var confirm = passInputs[1] ? passInputs[1].value : pass;
        var emailKey = (emailInput && emailInput.name) || 'register-email';
        var passKey = (passInputs[0] && passInputs[0].name) || 'register-password';
        var confirmKey = (passInputs[1] && passInputs[1].name) || 'register-confirm';
        var fieldErrs = {};
        if (!isValidEmail(email)) fieldErrs[emailKey] = uiMsg().invalidEmail;
        if (pass.length < 8) fieldErrs[passKey] = uiMsg().passwordTooShort;
        if (pass !== confirm) fieldErrs[confirmKey] = uiMsg().passwordsMismatch;
        if (termsEl && !termsEl.checked) fieldErrs.accept_terms = uiMsg().acceptTermsRequired;
        if (Object.keys(fieldErrs).length) {
          sdkFactory.setFieldErrors(regForm, fieldErrs);
          setStatus(rMsgEl, Object.values(fieldErrs)[0], 'error');
          return;
        }
        var displayName = (nameInput && nameInput.value.trim()) || email.split('@')[0];
        setStatus(rMsgEl, uiMsg().loading, 'loading', { scroll: false });
        sdkFactory.withFormBusy(regForm, rBtn, function () {
          return sdk.register({
            email: email,
            password: pass,
            password_confirmation: confirm,
            display_name: displayName,
            plan_code: selectedPlanCode || undefined
          }).then(function () {
            setStatus(rMsgEl, 'Account created. Redirecting...', 'success');
            window.location.href = selectedPlanCode
              ? ('./account.html?plan=' + encodeURIComponent(selectedPlanCode))
              : './account.html';
          }).catch(function (err) {
            if (err && err.details) {
              var mapped = {};
              if (err.details.email) mapped[emailKey] = err.details.email;
              if (err.details.password) mapped[passKey] = err.details.password;
              if (err.details.password_confirmation) mapped[confirmKey] = err.details.password_confirmation;
              sdkFactory.setFieldErrors(regForm, Object.keys(mapped).length ? mapped : err.details);
            }
            setStatus(rMsgEl, sdkFactory.formatPortalApiError(err, 'Registration failed.'), 'error');
          });
        });
      }, true);
    }

    var params = new URLSearchParams(window.location.search || '');
    var token = params.get('token');
    var recoveryWrap = document.querySelector('[data-recovery]');
    var resetWrap = document.querySelector('[data-reset]');
    var forgotForm = document.querySelector('form[data-form="recovery"], form[data-form="forgot"], form[data-form="forgot-password"]');
    var resetForm = document.querySelector('form[data-form="reset"]');
    if (token && resetForm) {
      if (recoveryWrap) recoveryWrap.hidden = true;
      if (resetWrap) resetWrap.hidden = false;
      sdkFactory.bindFormValidationClear(resetForm);
      var rstMsgEl = resetForm.querySelector('[data-portal-status], [data-form-message], [role="status"], .status');
      var rstBtn = resetForm.querySelector('button[type="submit"]');
      resetForm.addEventListener('submit', function (e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        sdkFactory.clearFieldErrors(resetForm);
        var passInputs = resetForm.querySelectorAll('input[type="password"]');
        var p1 = passInputs[0] ? passInputs[0].value : '';
        var p2 = passInputs[1] ? passInputs[1].value : p1;
        var p1Key = (passInputs[0] && passInputs[0].name) || 'reset-password';
        var p2Key = (passInputs[1] && passInputs[1].name) || 'reset-confirm';
        var fieldErrs = {};
        if (p1.length < 8) fieldErrs[p1Key] = uiMsg().passwordTooShort;
        if (p1 !== p2) fieldErrs[p2Key] = uiMsg().passwordsMismatch;
        if (Object.keys(fieldErrs).length) {
          sdkFactory.setFieldErrors(resetForm, fieldErrs);
          setStatus(rstMsgEl, Object.values(fieldErrs)[0], 'error');
          return;
        }
        setStatus(rstMsgEl, uiMsg().loading, 'loading', { scroll: false });
        sdkFactory.withFormBusy(resetForm, rstBtn, function () {
          return sdk.resetPassword({ token: token, password: p1, password_confirmation: p2 }).then(function () {
            setStatus(rstMsgEl, 'Password reset. Redirecting...', 'success');
            window.location.href = './login.html';
          }).catch(function (err) {
            if (err && err.details) sdkFactory.setFieldErrors(resetForm, err.details);
            setStatus(rstMsgEl, sdkFactory.formatPortalApiError(err, 'Reset failed. Request a new reset link.'), 'error');
          });
        });
      }, true);
    } else if (forgotForm) {
      sdkFactory.bindFormValidationClear(forgotForm);
      var fMsgEl = forgotForm.querySelector('[data-portal-status], [data-form-message], [role="status"], .status');
      var fBtn = forgotForm.querySelector('button[type="submit"]');
      forgotForm.addEventListener('submit', function (e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        sdkFactory.clearFieldErrors(forgotForm);
        var emailInput = forgotForm.querySelector('input[type="email"]');
        var email = emailInput ? emailInput.value.trim() : '';
        var emailKey = (emailInput && emailInput.name) || 'recovery-email';
        if (!isValidEmail(email)) {
          sdkFactory.setFieldErrors(forgotForm, { [emailKey]: uiMsg().invalidEmail });
          setStatus(fMsgEl, uiMsg().invalidEmail, 'error');
          return;
        }
        setStatus(fMsgEl, uiMsg().loading, 'loading', { scroll: false });
        sdkFactory.withFormBusy(forgotForm, fBtn, function () {
          return sdk.forgotPassword(email).then(function (res) {
            setStatus(fMsgEl, (res && res.message) || 'If an account exists, reset instructions have been sent.', 'success');
          }).catch(function (err) {
            if (err && err.details) sdkFactory.setFieldErrors(forgotForm, err.details);
            setStatus(fMsgEl, sdkFactory.formatPortalApiError(err, 'Request failed.'), 'error');
          });
        });
      }, true);
    }

  }

  var checkoutDialog = document.querySelector('dialog[data-checkout], #checkout-dialog, #checkout');
  var checkoutForm = checkoutDialog && checkoutDialog.querySelector('form');
  if (checkoutDialog && checkoutForm) {
    sdkFactory.bindFormValidationClear(checkoutForm);
    var syncKuniDialogLabels = function () {
      var ui = sdkFactory.getWishlistUiText();
      var regBtn = checkoutForm.querySelector('[data-plan-action="register"]');
      var wishBtn = checkoutForm.querySelector('[data-plan-action="wishlist"]');
      var tgBtn = checkoutForm.querySelector('[data-plan-dialog-tg]');
      if (regBtn) regBtn.textContent = ui.registerBtn;
      if (wishBtn) wishBtn.textContent = ui.wishlistBtn;
      if (tgBtn) tgBtn.textContent = ui.telegramBtn;
    };
    syncKuniDialogLabels();
    document.addEventListener('languagechange', syncKuniDialogLabels);

    document.addEventListener('click', function (e) {
      if (e.target && e.target.closest && e.target.closest('[data-open-checkout]')) {
        syncKuniDialogLabels();
        sdkFactory.clearFieldErrors(checkoutForm);
        var msgEl = checkoutForm.querySelector('[data-form-message], [data-portal-status]');
        if (msgEl) sdkFactory.clearPortalStatus(msgEl);
        var tgLink = checkoutForm.querySelector('[data-plan-dialog-tg]');
        if (tgLink) tgLink.hidden = true;
        var emailInput = checkoutForm.querySelector('input[type="email"]');
        if (emailInput && !emailInput.value && sdk.isAuthenticated()) {
          if (cachedClientEmail) {
            emailInput.value = cachedClientEmail;
          } else {
            sdk.getMe().then(function (me) {
              if (me && me.client && me.client.email && !emailInput.value) {
                cachedClientEmail = me.client.email;
                emailInput.value = cachedClientEmail;
              }
            }).catch(function () {});
          }
        }
      }
    });

    var submitKuniPlanDialog = function (intent, triggerBtn) {
      sdkFactory.clearFieldErrors(checkoutForm);
      var ui = sdkFactory.getWishlistUiText();
      var emailInput = checkoutForm.querySelector('input[type="email"]');
      var emailKey = (emailInput && emailInput.name) || 'checkout-email';
      var emailVal = emailInput ? emailInput.value.trim() : '';
      var msgEl = checkoutForm.querySelector('[data-form-message], [data-portal-status]');
      var tgLink = checkoutForm.querySelector('[data-plan-dialog-tg]');

      if (!isValidEmail(emailVal)) {
        var errMsg = ui.emailInvalid || uiMsg().invalidEmail;
        sdkFactory.setFieldErrors(checkoutForm, { [emailKey]: errMsg });
        setStatus(msgEl, errMsg, 'error', { scroll: false });
        return;
      }

      var planInput = checkoutDialog.querySelector('#checkout-plan, [data-plan]');
      var plan = findKuniPlan(planInput ? planInput.value : 'quarterly');
      var source = intent === 'register' ? 'plan_dialog_register' : 'plan_dialog_wishlist';
      var meta = {
        intent: intent,
        source_page: 'index',
        plan_name: plan.name,
        price_minor: plan.price_minor,
        currency: 'EUR'
      };

      if (intent === 'register') {
        sdkFactory.withFormBusy(checkoutForm, triggerBtn, function () {
          var timeout = new Promise(function (resolve) { window.setTimeout(resolve, 1500); });
          return Promise.race([
            sdk.joinWishlist({ email: emailVal, planCode: plan.plan_code, source: source, meta: meta }).catch(function () { return null; }),
            timeout
          ]).then(function () {
            if (sdk.isAuthenticated()) {
              window.location.href = './account.html?plan=' + encodeURIComponent(plan.plan_code);
              return;
            }
            sdk.savePlanSelectionHandoff({ email: emailVal, planCode: plan.plan_code });
            window.location.href = './create-account.html?plan=' + encodeURIComponent(plan.plan_code);
          });
        }, { loadingText: ui.submitting });
        return;
      }

      setStatus(msgEl, ui.submitting, 'loading', { scroll: false });
      sdkFactory.withFormBusy(checkoutForm, triggerBtn, function () {
        return sdk.joinWishlist({
          email: emailVal,
          planCode: plan.plan_code,
          source: source,
          meta: meta
        }).then(function (res) {
          var msg = (res && res.already_registered) ? (ui.planUpdated || ui.successExisting) : ui.successNew;
          setStatus(msgEl, msg, (res && res.already_registered) ? 'info' : 'success', { scroll: false });
          if (tgLink && currentSiteConfig && currentSiteConfig.wishlist_bot_url) {
            tgLink.href = currentSiteConfig.wishlist_bot_url;
            tgLink.hidden = false;
          }
        }).catch(function (err) {
          setStatus(msgEl, sdkFactory.formatPortalApiError(err, ui.errorGeneric), 'error', { scroll: false });
        });
      }, { loadingText: ui.submitting });
    };

    var regAction = checkoutForm.querySelector('[data-plan-action="register"]');
    var wishAction = checkoutForm.querySelector('[data-plan-action="wishlist"]');
    if (regAction) regAction.addEventListener('click', function () { submitKuniPlanDialog('register', regAction); });
    if (wishAction) wishAction.addEventListener('click', function () { submitKuniPlanDialog('wishlist', wishAction); });
    checkoutForm.addEventListener('submit', function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      submitKuniPlanDialog('register', regAction || wishAction);
    }, true);
  }

  var vpnPanel = document.querySelector('[data-sdk-vpn-panel]');
  if (!vpnPanel) return;

  if (sdk.mode === 'live') {
    if (!sdk.isAuthenticated()) {
      window.location.replace('./login.html');
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
  var devicesBody = document.querySelector('[data-sdk-devices]');
  var devicesCount = document.querySelector('[data-sdk-devices-count]');
  var billingBody = document.querySelector('[data-sdk-billing]');
  var topStatusNote = document.querySelector('.account-content > [data-portal-status]');
  var statusNote = vpnPanel.querySelector('[data-sdk-status]') || topStatusNote;
  var devicesStatusNote = document.querySelector('[data-devices-status]') || statusNote;

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
          setStatus(devicesStatusNote, sdkFactory.formatPortalApiError(err, 'Could not revoke device.'), 'error');
        });
      });
      devicesBody.appendChild(tr);
    });
  }

  var vpnConnectCtrl = null;

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
      sdkFactory.appendServerVlessActions(tr.children[3], srv, {
        statusEl: statusNote,
        onSelectQr: function (selectedSrv) {
          if (vpnConnectCtrl && typeof vpnConnectCtrl.selectServerVless === 'function') {
            vpnConnectCtrl.selectServerVless(selectedSrv);
          }
        }
      });
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
      return Promise.all([sdk.getMe(), sdk.getSubscription(), Promise.resolve({ payments: [] }), siteConfigPromise]);
    }).then(function (all) {
      var me = all[0];
      var subRes = all[1];
      var billRes = all[2];
      var siteCfg = all[3];
      var serversAllowed = sdkFactory.isSiteServersEnabled(siteCfg);
      sdkFactory.revealAuthGate();
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
      var accCheckoutForm = document.querySelector('[data-account-checkout-form]');
      if (accCheckoutForm && sdkFactory.isSiteCheckoutEnabled(siteCfg)) {
        accCheckoutForm.hidden = false;
        var urlPlan = new URLSearchParams(window.location.search || '').get('plan');
        var planSelect = accCheckoutForm.querySelector('[data-account-plan-select]');
        if (planSelect && urlPlan && planSelect.querySelector('option[value="' + urlPlan + '"]')) {
          planSelect.value = urlPlan;
        }
        var providerHost = accCheckoutForm.querySelector('[data-payment-providers]');
        if (providerHost && !accCheckoutForm.__providersMounted) {
          accCheckoutForm.__providersMounted = true;
          var getAccProvider = function () { return null; };
          sdkFactory.mountPaymentProviderSelector(sdk, providerHost).then(function (getter) {
            if (typeof getter === 'function') getAccProvider = getter;
          });
          var chkStatus = accCheckoutForm.querySelector('[data-account-checkout-status]') || statusNote;
          var chkBtn = accCheckoutForm.querySelector('button[type="submit"]');
          accCheckoutForm.addEventListener('submit', function (ev) {
            ev.preventDefault();
            var chosenPlan = (planSelect && planSelect.value) || 'quarterly';
            var returnUrl = new URL('./account.html', window.location.href).href;
            var cancelUrl = new URL('./account.html?status=cancelled', window.location.href).href;
            setStatus(chkStatus, uiMsg().loading, 'loading', { scroll: false });
            sdkFactory.withFormBusy(accCheckoutForm, chkBtn, function () {
              return sdk.checkout({
                plan_code: chosenPlan,
                provider: getAccProvider(),
                return_url: returnUrl,
                cancel_url: cancelUrl
              }).then(function (res) {
                sdkFactory.handleCheckoutResponse(sdk, res);
              }).catch(function (err) {
                setStatus(chkStatus, sdkFactory.formatPortalApiError(err, 'Checkout failed.'), 'error');
              });
            });
          });
        }
      }
      var tabVpn = document.querySelector('#tab-vpn-access');
      var tabDev = document.querySelector('#tab-devices');
      var panelDev = document.querySelector('#panel-devices');
      if (!serversAllowed) {
        if (tabVpn) tabVpn.hidden = true;
        if (vpnPanel) vpnPanel.hidden = true;
        if (tabDev) tabDev.hidden = true;
        if (panelDev) panelDev.hidden = true;
        if (window.__kuniAccountTabs && typeof window.__kuniAccountTabs.refresh === 'function') {
          window.__kuniAccountTabs.refresh();
        }
        var waitlistHost = document.querySelector('.account-content') || vpnPanel;
        sdkFactory.mountAccountWaitlistCard(waitlistHost, siteCfg, { prepend: true, className: 'card' });
        return;
      }
      if (tabVpn) tabVpn.hidden = false;
      if (tabDev) tabDev.hidden = false;
      if (window.__kuniAccountTabs && typeof window.__kuniAccountTabs.refresh === 'function') {
        window.__kuniAccountTabs.refresh();
      }
      accessKey = (sub && sub.access_key) || '';
      if (keyEl) keyEl.textContent = revealed ? accessKey : maskKey(accessKey);
      if (!accessKey) {
        if (vpnConnectCtrl) { vpnConnectCtrl.hide(); vpnConnectCtrl = null; }
        renderServers([]);
        renderDevices({ limit: 5, devices: [] });
        return;
      }
      sdk.getBootstrap(accessKey).then(function (boot) {
        var connectAnchor = (keyEl && keyEl.parentElement) || vpnPanel;
        vpnConnectCtrl = sdkFactory.mountVpnConnectPanel(connectAnchor, boot, {
          createQrMatrix: createQrMatrix,
          placement: 'after'
        });
        renderServers((boot && boot.servers) || []);
      }).catch(function (err) {
        if (vpnConnectCtrl) { vpnConnectCtrl.hide(); vpnConnectCtrl = null; }
        if (err.code === 'KEY_EXPIRED') {
          setStatus(topStatusNote || statusNote, uiMsg().keyExpired, 'warning');
        } else if (err.code === 'KEY_REVOKED') {
          setStatus(topStatusNote || statusNote, uiMsg().keyRevoked, 'error');
        } else if (err.code === 'DEVICE_LIMIT_REACHED' || err.status === 409) {
          setStatus(topStatusNote || statusNote, uiMsg().deviceLimitReached, 'warning');
          var errDevices = err.payload && err.payload.error && err.payload.error.devices;
          if (Array.isArray(errDevices)) renderDevices({ limit: 5, devices: errDevices });
        } else {
          setStatus(topStatusNote || statusNote, sdkFactory.formatPortalApiError(err, 'Unable to load VPN servers.'), 'error');
        }
      });
      sdk.getDevices(accessKey).then(renderDevices).catch(function () { /* ignore */ });
    }).catch(function (err) {
      if (sdk.mode === 'live' && (!sdk.isAuthenticated() || (err && (err.status === 401 || err.code === 'UNAUTHORIZED')))) {
        sdk.clearSession();
        window.location.replace('./login.html');
        return;
      }
      sdkFactory.revealAuthGate();
      setStatus(topStatusNote || statusNote, sdkFactory.formatPortalApiError(err, 'Unable to load VPN access data.'), 'error');
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
        setStatus(profileForm.querySelector('[data-form-message]') || statusNote, 'Profile updated.', 'success');
      }).catch(function (err) {
        setStatus(profileForm.querySelector('[data-form-message]') || statusNote, sdkFactory.formatPortalApiError(err, 'Update failed.'), 'error');
      });
    }, true);
  }

  var passForm = document.querySelector('[data-password-form]');
  if (passForm) {
    sdkFactory.bindFormValidationClear(passForm);
    var pwStatus = passForm.querySelector('[data-password-status]') || statusNote;
    var pwBtn = passForm.querySelector('button[type="submit"]');
    passForm.addEventListener('submit', function (e) {
      e.preventDefault();
      sdkFactory.clearFieldErrors(passForm);
      var cur = passForm.current_password.value;
      var nextPw = passForm.password.value;
      var confirmPw = passForm.password_confirmation.value;
      var fieldErrs = {};
      if (!cur) fieldErrs.current_password = uiMsg().requiredField;
      if (nextPw.length < 8) fieldErrs.password = uiMsg().passwordTooShort;
      if (nextPw !== confirmPw) fieldErrs.password_confirmation = uiMsg().passwordsMismatch;
      if (Object.keys(fieldErrs).length) {
        sdkFactory.setFieldErrors(passForm, fieldErrs);
        setStatus(pwStatus, Object.values(fieldErrs)[0], 'error');
        return;
      }
      setStatus(pwStatus, uiMsg().loading, 'loading', { scroll: false });
      sdkFactory.withFormBusy(passForm, pwBtn, function () {
        return sdk.changePassword({
          current_password: cur,
          password: nextPw,
          password_confirmation: confirmPw
        }).then(function () {
          passForm.reset();
          setStatus(pwStatus, 'Password updated.', 'success');
        }).catch(function (err) {
          if (err && err.details) sdkFactory.setFieldErrors(passForm, err.details);
          setStatus(pwStatus, sdkFactory.formatPortalApiError(err, 'Password update failed.'), 'error');
        });
      });
    });
  }

  var signOutBtn = document.querySelector('[data-signout]');
  if (signOutBtn && sdk.mode === 'live') {
    signOutBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();
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
    sdkFactory.bindFormValidationClear(supportForm);
    var sStatus = supportForm.querySelector('[data-support-status]') || statusNote;
    var sBtn = supportForm.querySelector('button[type="submit"]');
    supportForm.addEventListener('submit', function (e) {
      e.preventDefault();
      sdkFactory.clearFieldErrors(supportForm);
      var subject = supportForm.subject.value.trim();
      var message = supportForm.message.value.trim();
      var fieldErrs = {};
      if (subject.length < 3) fieldErrs.subject = uiMsg().subjectTooShort;
      if (message.length < 5) fieldErrs.message = uiMsg().messageTooShort;
      if (Object.keys(fieldErrs).length) {
        sdkFactory.setFieldErrors(supportForm, fieldErrs);
        setStatus(sStatus, Object.values(fieldErrs)[0], 'error');
        return;
      }
      setStatus(sStatus, uiMsg().loading, 'loading', { scroll: false });
      sdkFactory.withFormBusy(supportForm, sBtn, function () {
        return sdk.createSupportTicket({
          subject: subject,
          message: message
        }).then(function () {
          supportForm.reset();
          setStatus(sStatus, 'Support request submitted.', 'success');
        }).catch(function (err) {
          if (err && err.details) sdkFactory.setFieldErrors(supportForm, err.details);
          setStatus(sStatus, sdkFactory.formatPortalApiError(err, 'Support request failed.'), 'error');
        });
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
        navigator.clipboard.writeText(accessKey).then(function () { setStatus(statusNote, 'VPN key copied.', 'success', { scroll: false }); }).catch(function () { setStatus(statusNote, 'Could not copy VPN key.', 'error', { scroll: false }); });
      }
    });
  }
}

module.exports = { initPortalSdkBridge: initPortalSdkBridge };
