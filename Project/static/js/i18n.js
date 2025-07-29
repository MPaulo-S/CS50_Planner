// Setup is created by ChatGPT serving as an quick introduction to the i18next library & usage
// Adaptions are made with documentation use and some AI help

// Initialize i18next with plugins and backend config
i18next
  .use(i18nextHttpBackend)
  .use(i18nextBrowserLanguageDetector)
  .init({
    debug: true,
    fallbackLng: 'en',
    fallbackNS: 'common',
    load: 'languageOnly',  // ensure 'en' not 'en-US'
    ns: ['common', 'tasks'], // add more as needed (consider loading after init as well)
    defaultNS: 'common',
    backend: {
      loadPath: '/static/locales/{{lng}}/{{ns}}.json'
    }
  }, function(err, t) {
    console.log("✅ i18next initialized");
    console.log("🌐 Current language:", i18next.language);
    console.log("📦 Loaded resources:", i18next.store.data);

    // Enable auto DOM translation
    jqueryI18next.init(i18next, $, {
      tName: 't', i18nName: 'i18n', handleName: 'localize',
      selectorAttr: 'data-i18n',
      useOptionsAttr: false,
      parseDefaultValueFromContent: true
    });

    updateContent();
  });

// Update visible content using i18n keys
function updateContent() {

   // Automatic DOM translation via jQuery
  $('body').localize();

  // Dynamic update of title depending on path:
  const path = window.location.pathname;
  console.log("🚧 Current path:", path);
  let titleKey = 'title.default';

  // Match paths and titles
  if (path === '/') {
    titleKey = 'title.index';
  } else if (path === '/error' || (path === '/trigger-error')) {
    titleKey = 'title.error';
  } else if (path === '/login') {
    titleKey = 'title.login';
  } else if (path === '/register') {
    titleKey = 'title.register';
  }

  // Define title
  document.title = i18next.t(titleKey);


  // Hide button of current language (self-built)
  let languageActive = 'lang_' + i18next.language;
  let langButtons = document.getElementsByName('lang_sel');

  for (let button of langButtons) {
    if (button.id === languageActive) {
      button.style.display = "none";
    } else {
      button.style.display = "inline-block";
    }
  };


// Update placeholders manually
  const placeholderMap = {
    loginUsername: 'session.usernamePlaceholder',
    loginPassword: 'session.passwordPlaceholder',
    placeholderPasswordConfirmation: 'session.passwordPlaceholder'
  };

  Object.keys(placeholderMap).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.placeholder = i18next.t(placeholderMap[id]);
  });
}


// Allow language switch on click
function changeLanguage(lng) {
  i18next.changeLanguage(lng, updateContent);
}
