'use strict';

var service = angular.module('songhop.services', ['ionic.utils']);

service.factory('UserService', function ($http, $q, $localstorage, SERVER) {
    var o = {
        username: false,
        session_id: false,
        favorites: [],
        newFavorites: 0
    };

    o.auth = function (username, signingUp) {
        var authRoute;
        if (signingUp) {
            authRoute = 'signup';
        } else {
            authRoute = 'login';
        }

        return $http.post(SERVER.url + '/' + authRoute, { username: username })
            .success(function (data) {
                o.setSession(data.username, data.session_id, data.favorites);
            });
    };

    o.setSession = function (username, session_id, favorites) {
        if (username) o.username = username;
        if (session_id) o.session_id = session_id;
        if (favorites) o.favorites = favorites;

        $localstorage.setObject('user', { username: username, session_id: session_id });

    };

    // check if there's an user session present
    o.checkSession = function () {
        var defer = $q.defer();

        if (o.session_id) {
            defer.resolve(true);
        } else {
            // detect if there's a session in localstorage from previous use.
            // if true, then pull into service
            var user = $localstorage.getObject('user');

            if (user.username) {
                o.setSession(user.username, user.session_id);
                o.populateFavorites().then(function () {
                    defer.resolve(true);
                });
            } else {
                // no user info in localstorage, reject
                defer.resolve(false);
            }
        }
        return defer.promise;
    };

    o.destroySession = function () {
        $localstorage.setObject('user', {});
        o.username = false;
        o.session_id = false;
        o.favorites = [];
        o.newFavorites = 0;
    };

    o.addSongToFavorites = function (song) {
        if (!song) return false;

        o.favorites.unshift(song);
        o.newFavorites++;

        return $http.post(SERVER.url + '/favorites', { session_id: o.session_id, song_id: song.song_id });
    };

    o.removeSongFromFavorites = function (song, index) {
        if (!song) return false;

        o.favorites.splice(index, 1);

        return $http({
            method: 'DELETE',
            url: SERVER.url + '/favorites',
            params: { session_id: o.session_id, song_id: song.song_id }
        });
    };

    o.populateFavorites = function () {
        return $http({
            method: 'GET',
            url: SERVER.url + '/favorites',
            params: { session_id: o.session_id }
        }).success(function (data) {
            o.favorites = data;
        });
    };

    o.favCount = function () {
        return o.newFavorites;
    };
    return o;
});

service.factory('RecommendationsService', function ($http, SERVER, $q) {
    var o = {
        queue: []
    };

    // placeholder for the media player
    var media;

    o.init = function () {
        if (o.queue.length === 0) {
            // if there's nothing in the queue, fill it.
            // this also means that this is the first call of init.
            return o.getNextSongs();
        }
        // otherwise, play the current song
        return o.playCurrentSong();
    };

    o.getNextSongs = function () {
        return $http({
            method: 'GET',
            url: SERVER.url + '/recommendations'
        }).success(function (data) {
            // merge data into the queue
            o.queue = o.queue.concat(data);
        });
    };

    o.nextSong = function () {
        // pop the index 0 off
        o.queue.shift();

        // end the song
        o.haltAudio();

        // low on the queue? lets fill it up
        if (o.queue.length <= 3) {
            o.getNextSongs();
        }
    };

    o.playCurrentSong = function () {
        var defer = $q.defer();

        // play the current song's preview
        media = new Audio(o.queue[0].preview_url);
        media.addEventListener('loadeddata', function () {
            defer.resolve();
        });

        media.play();

        return defer.promise;
    };

    // used when switching to favorites tab
    o.haltAudio = function () {
        if (media) media.pause();
    };

    return o;
});
