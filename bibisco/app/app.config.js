angular.module('bibiscoApp')
.config(['$locationProvider', '$routeProvider',
function config($locationProvider, $routeProvider) {
  $locationProvider.hashPrefix('!');
  $routeProvider.
  when('/chapters/:chapterId', {
    template: '<chapter></chapter>'
  }).
  when('/main', {
    template: '<main></main>'
  }).
  when('/start', {
    template: '<p>Start</p>'
  }).
  when('/welcome', {
    template: '<languageselect></languageselect><h1>{{"jsp.welcome.h1" | translate}}</h1><p>{{ 1000000 | currency }}</p>'
  }).
  otherwise('/main');
}
])
.config(function ($translateProvider) {

    var langMap = {
      'cs': 'cs',
      'de': 'de',
      'en-ca': 'en',
      'en-gb': 'en',
      'en-us': 'en',
      'es': 'es',
      'fr': 'fr',
      'it': 'it',
      'pl': 'pl',
      'pt': 'pt'
    };

    $translateProvider
    .useStaticFilesLoader({
        prefix: 'resources/locale-',// path to translations files
        suffix: '.json'// suffix, currently- extension of the translations
    })
    .registerAvailableLanguageKeys(['cs', 'de', 'en', 'es', 'fr', 'it', 'pl', 'pt'], langMap) // register available languages
    .determinePreferredLanguage()// is applied on first load
    .fallbackLanguage(['en']) // fallback language
    .useSanitizeValueStrategy(null) // sanitize strategy: null until 'sanitize' mode is fixed
    ;
})
.config(function (tmhDynamicLocaleProvider) {
    tmhDynamicLocaleProvider.localeLocationPattern('../bower_components/angular-i18n/angular-locale_{{locale}}.js');
})
.constant('LOCALES', {
    'locales': {
        'cs': 'Český',
        'de': 'Deutsch',
        'en-ca': 'English (Canada)',
        'en-gb': 'English (UK)',
        'en-us': 'English (USA)',
        'es': 'Español',
        'fr': 'Français',
        'it': 'Italiano',
        'pl': 'Polski',
        'pt': 'Português (Brasil)'
    }
})
;
