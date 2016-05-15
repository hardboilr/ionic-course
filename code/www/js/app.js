'use strict';

var myApp = angular.module('songhop', ['ionic','ionic.service.core', 'songhop.controllers']);

myApp.run(function ($ionicPlatform) {
    $ionicPlatform.ready(function () {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        if (window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
        if (window.StatusBar) {
            StatusBar.styleDefault();
        }
    });
});

myApp.config(function ($stateProvider, $urlRouterProvider) {

    // If none of the above states are matched, use this as the fallback;
    $urlRouterProvider.otherwise('/');

    // splash page loads at startup
    $stateProvider.state('splash', {
        url: '/',
        templateUrl: 'templates/splash.html',
        controller: 'SplashCtrl',
        onEnter: function ($state, UserService) {
            UserService.checkSession().then(function (hasSession) {
                if (hasSession) $state.go('tab.discover');
            });
        }
    });

    $stateProvider.state('tab', {
        url: '/tab',
        abstract: true,
        templateUrl: 'templates/tabs.html',
        controller: 'TabsCtrl',
        // don-t load state until we've populated our UserService, if necessary
        resolve: {
            populateSession: function (UserService) {
                return UserService.checkSession();
            }
        },
        onEnter: function ($state, UserService) {
            UserService.checkSession().then(function (hasSession) {
                if (!hasSession) $state.go('splash');
            });
        }
    });

    $stateProvider.state('tab.discover', {
        url: '/discover',
        views: {
            'tab-discover': {
                templateUrl: 'templates/discover.html',
                controller: 'DiscoverCtrl'
            }
        }
    });

    $stateProvider.state('tab.favorites', {
        url: '/favorites',
        views: {
            'tab-favorites': {
                templateUrl: 'templates/favorites.html',
                controller: 'FavoritesCtrl'
            }
        }
    });
});

myApp.constant('SERVER', {
    // Public Heroku server from Thinkster.IO
    url: 'https://ionic-songhop.herokuapp.com'
});
