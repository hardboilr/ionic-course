'use strict';

var ctrl = angular.module('songhop.controllers', ['ionic', 'songhop.services']);


ctrl.controller('DiscoverCtrl', function ($scope, $timeout, $ionicLoading, UserService, RecommendationsService) {

    // helper functions for loading
    var showLoading = function () {
        $ionicLoading.show({
            template: '<i class="ion-loading-c"></i>',
            noBackdrop: true
        });
    };

    var hideLoading = function () {
        $ionicLoading.hide();
    };

    // set loading to true first time while we retrieve songs from server.
    showLoading();

    // first we'll need to initialize the Rec service, get our first songs, etc
    RecommendationsService.init()
        .then(function () {
            $scope.currentSong = RecommendationsService.queue[0];
            return RecommendationsService.playCurrentSong();
        })
        .then(function () {
            hideLoading();
            $scope.currentSong.loaded = true;
        });

    $scope.sendFeedback = function (bool) {

        // first, add to favorites if they favorited
        if (bool) UserService.addSongToFavorites($scope.currentSong);

        // set variable for the correct animation sequence
        $scope.currentSong.rated = bool;
        $scope.currentSong.hide = true;

        // prepare the next song
        RecommendationsService.nextSong();

        // update current song in scope, timeout to allow animation to complete
        $timeout(function () {
            $scope.currentSong = RecommendationsService.queue[0];
            $scope.currentSong.loaded = false;
        }, 250);

        RecommendationsService.playCurrentSong()
            .then(function () {
                $scope.currentSong.loaded = true;
            });
    };

    // used for retrieving the next album image.
    // if there isn't an album image available next, return empty string.
    $scope.nextAlbumImg = function () {
        if (RecommendationsService.queue.length > 1) {
            return RecommendationsService.queue[1].image_large;
        }
        return '';
    };
});

ctrl.controller('FavoritesCtrl', function ($scope, $window, UserService) {

    // get the list of our favorites from the user service
    $scope.favorites = UserService.favorites;
    $scope.username = UserService.username;

    $scope.removeSong = function (song, index) {
        UserService.removeSongFromFavorites(song, index);
    };

    $scope.openSong = function (song) {
        $window.open(song.open_url, '_system');
    };
});

ctrl.controller('TabsCtrl', function ($window, $scope, RecommendationsService, UserService) {

    // expose the number of new favorites to the scope
    $scope.favCount = UserService.favCount;

    // method to reset new favorites to 0 when we click the fav tab
    $scope.enteringFavorites = function () {
        RecommendationsService.haltAudio();
        UserService.newFavorites = 0;
    };

    $scope.leavingFavorites = function () {
        RecommendationsService.init();
    };

    $scope.logout = function () {
        UserService.destroySession();

        $window.location.href = '/';
    };
});

ctrl.controller('SplashCtrl', function ($scope, $state, UserService) {

    // get the list of our favorites from the user service
    $scope.submitForm = function (username, signingUp) {
        UserService.auth(username, signingUp)
            .then(function () {
                $state.go('tab.discover');
            }, function () {
                alert('Hmmm... try another username');
            });
    };
});