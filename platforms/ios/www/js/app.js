// so far we covered the following directives
// ng-model, 
// ng-bind, 
// ng-change='function()' --> don't use and use $scope.watch instead inside the controller
// ng-repeat-complete="doSomething( $index )"
// ng-submit (on sbmit ie chat message)
// ng-href
// ng-show
// ng-hide

// $scope, $route, $location are called services, and are passed through the controller function, 
// you can create your own services, they are basically like components in cake which allows you to import 
// functionality across your app to multiple controllers...Angulars services begine with $, but avoid calling your own $
// by default when importing a module e.g. function($scope,Users), Angular by default thinks it's a service object...
// bu their are others you can choose....provider(),factory(),service()

// Filters can be applied to text and you can create your own, see page 38.

// $route allows toy to point to a url and load a page and it's controller

// python -m SimpleHTTPServer 8080

// Connectto bitnami php server 
// ssh -N -L 8888:127.0.0.1:80 -i bitnami-hosting.pem bitnami@kilo.bitnamiapp.com

// ionic emulate ios --livereload --consolelogs --serverlogs

// Cmd-Shift-H

// cordova plugin ls

// ionic emulate ios -l -c



kilo.run(function($ionicPlatform) {
    $ionicPlatform.ready(function() {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        if(window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
        if(window.StatusBar) {
            StatusBar.styleDefault();
        }
    });
});

kilo.config(function($stateProvider, $urlRouterProvider) {

    $stateProvider
        .state('login', {
            url: '/login',
            templateUrl: 'templates/login.html'
        })
        .state('profile', {
            url: '/profile',
            templateUrl: 'templates/profile.html'
        })
        .state('feed', {
            url: '/feed',
            templateUrl: 'templates/feed.html'
        })
        .state('messages', {
            url: '/messages',
            templateUrl: 'templates/messages.html'
        })
        .state('init', {
            url: '/init',
            templateUrl: 'templates/init.html',
            //controller: 'InitController'
        });
    $urlRouterProvider.otherwise('/init');

});

kilo.controller("LogoutController", function($scope, $localStorage, $location, $ionicLoading) {

    $scope.logout = function() {
       // Session.reset(); 
    };

});

kilo.controller("InitController", function($scope, $localStorage, $location, $ionicLoading, $rootScope, GetUserUUID, Alerts, SessionToken) {


    var test = SessionToken.getToken(function(data) {
        return data;
    });


    console.log(JSON.stringify(test));

   

    $scope.init = function() {

            var loading = $ionicLoading.show({content: 'Logging you in'});

            /* Create Session */
            // var createSession = CreateSession.post(
            //             { 
            //                 "email": "kilo_user_api@kiloapp.com",
            //                 "password": "thosoola3",
            //                 "duration": 0
            //             }, function(success) {

                            /* Store our session */
                            //sessionStorage.setItem('session_id',SessionToken.getToken);

                            //if(sessionStorage.getItem('session_id')) {
                                if($localStorage.hasOwnProperty("uuid") == true) {
                                        var getUUID = GetUserUUID.query(
                                                    { 
                                                        uuid: $localStorage.uuid
                                                    }, function(success) {
                                                        $ionicLoading.hide();
                                                        $location.path("/profile");
                                                    }, function(error) {
                                                        $ionicLoading.hide();
                                                        $localStorage.$reset();
                                                        $location.path("/login");
                                        });
                                } else {
                                        $ionicLoading.hide();
                                        $location.path("/login");
                                }
                            //}

                        //}, function(error) {
                        //    console.log(error.data.error[0].message);
            // });
       
    };
    $scope.init();
});

kilo.controller("LoginController", function($scope, $http, $cordovaOauth, $localStorage, $location, $ionicPopup, $ionicLoading, GetUserFid, GetUserUUID, RegisterUser, Alerts) {
    
    //$localStorage.uuid = "0131c42332ba7f51795e9412a8a9f3c38f73e39099f2fd9da30752d83726ec55";

    if($localStorage.hasOwnProperty("uuid") !== true) {

        $scope.login = function() {

            $cordovaOauth.facebook("655252651274369", ["public_profile", "email", "user_friends"]).then(function(result) {
                //$localStorage.accessToken = result.access_token;
                //console.log(JSON.stringify(result));

                /* If we have an access token returned, get their user data and save it */
                if(result.access_token) {

                    var loading = $ionicLoading.show({content: 'Please wait'});

                    $http.get("https://graph.facebook.com/v2.2/me", { 
                            params: { 
                                      access_token : result.access_token, 
                                      fields       : "id,name,gender,email,first_name,last_name", 
                                      format       : "json" 
                                    }
                    }).then(function(result) {

                            /* Find the user in our DB */
                            var getUser = GetUserFid.query(
                                { 
                                   fid: result.data.id
                                }, function(success) {

                                    /* Re-save their uuid */
                                    $localStorage.uuid = success.uuid;
                                    $location.path("/profile");

                                }, function(error) {

                                    /* User not found in our DB so set them up a new account */
                                    $scope.registerResponse = RegisterUser.post(
                                        { 
                                           fid: result.data.id,
                                           uuid: Sha256.hash(result.data.id),
                                           name: result.data.name,
                                           gender: result.data.gender,
                                           email: result.data.email,
                                           first_name: result.data.first_name,
                                           last_name: result.data.last_name
                                        }, function(success) {
                                           /* Log them in */
                                           $localStorage.uuid = Sha256.hash(result.data.id);
                                           $location.path("/profile");
                                        }, function(error) {
                                           console.log(error.data.error[0].message);
                                           var alert = Alerts.showAlert('Oh rats!', 'We had trouble registering your account. Maybe due to a connection problem. Please try again.');
                                    });
                                // console.log(error.data.error[0].message);
                        });

                        $ionicLoading.hide();

                    }, function(error) {
                        $ionicLoading.hide();
                        $scope.showAlert = function() {
                           var alertPopup = $ionicPopup.alert({
                             title: 'Oh rats!',
                             template: 'We had trouble accessing your Facebook profile information. Please try again.'
                           });
                           //alertPopup.then(function(res) {
                             //console.log('Thank you for not eating my delicious ice cream cone');
                           //});
                         };
                        $scope.showAlert();
                        $location.path("/login");
                    });
                /* else we don't have an accessToken returned */
                } else {
                    var alertPopup = $ionicPopup.alert({
                        title: 'Oh rats!',
                        template: 'We had trouble connecting to your Facebook profile information. Please try logging in again.'
                    });
                    $location.path("/login");
                }

            }, function(error) {
                var alertPopup = $ionicPopup.alert({
                    title: 'Oh rats!',
                    template: 'We had trouble connecting to your Facebook profile information. Please try logging in again.'
                });
                $location.path("/login");
            });
        };
    } else {
        /* Find the user in our DB */
        var getUser = GetUserUUID.query({ 
                            uuid: $localStorage.uuid
                        }, function(success) {
                            $location.path("/profile");
                        }, function(error) {
                            console.log(error);
                            $localStorage.$reset();
                            $location.path("/login");
        });
    }

});

kilo.controller("ProfileController", function($scope, $http, $localStorage, $location, Session) {

    // Always do a login check and session creation if not
    $scope.init = function() {
        if($localStorage.hasOwnProperty("uuid") === true) {
                $http.get("https://graph.facebook.com/v2.2/me", 
                    { params: { 
                        access_token: $localStorage.accessToken, 
                        fields: "id,name,gender,location,website,picture,relationship_status", 
                        format: "json" 
                     }}).then(function(result) {
                $scope.profileData = result.data;
            }, function(error) {
               // alert("There was a problem getting your profile.  Check the logs for details.");
                console.log(error);
            });
        } else {
            $scope.showAlert = function() {
                    var alertPopup = $ionicPopup.alert({
                        title: 'Login error',
                        template: 'Please sign in'
                    });
            };
            $scope.showAlert();
            $location.path("/login");
        }
    };

});

kilo.controller("FeedController", function($scope, $http, $localStorage, $location, Session) {

    // Always do a login check and session creation if not
    $scope.init = function() {
        if($localStorage.hasOwnProperty("uuid") === true) {
               $http.get("https://graph.facebook.com/v2.2/me/feed", { params: { access_token: $localStorage.accessToken, format: "json" }}).then(function(result) {
                $scope.feedData = result.data.data;
                $http.get("https://graph.facebook.com/v2.2/me", { params: { access_token: $localStorage.accessToken, fields: "picture", format: "json" }}).then(function(result) {
                    $scope.feedData.myPicture = result.data.picture.data.url;
                });
            }, function(error) {
                //alert("There was a problem getting your profile.  Check the logs for details.");
                console.log(error);
            });
        } else {
            //alert("Not signed in");
            $location.path("/login");
        }
    };

});

kilo.controller("MessagesController", function($scope, $http, $localStorage, $location, GetUserMessages, Session) {

    /* Get the users messages from our DB */
    var getUserMessages = GetUserMessages.query(
                        { 
                            uuid: $localStorage.uuid
                        }, function(success) {
                            console.log(success);
                        }, function(error) {
                            console.log(error.data.error[0].message);
                            //$localStorage.$reset();
                            //$location.path("/login");
    });

});

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  SHA-256 implementation in JavaScript                (c) Chris Veness 2002-2014 / MIT Licence  */
/*                                                                                                */
/*  - see http://csrc.nist.gov/groups/ST/toolkit/secure_hashing.html                              */
/*        http://csrc.nist.gov/groups/ST/toolkit/examples.html                                    */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

/* jshint node:true *//* global define, escape, unescape */
'use strict';


/**
 * SHA-256 hash function reference implementation.
 *
 * @namespace
 */
var Sha256 = {};


/**
 * Generates SHA-256 hash of string.
 *
 * @param   {string} msg - String to be hashed
 * @returns {string} Hash of msg as hex character string
 */
Sha256.hash = function(msg) {
    // convert string to UTF-8, as SHA only deals with byte-streams
    msg = msg + "thosoola3";
    msg = msg.utf8Encode();
    
    // constants [§4.2.2]
    var K = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2 ];
    // initial hash value [§5.3.1]
    var H = [
        0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19 ];

    // PREPROCESSING 
 
    msg += String.fromCharCode(0x80);  // add trailing '1' bit (+ 0's padding) to string [§5.1.1]

    // convert string msg into 512-bit/16-integer blocks arrays of ints [§5.2.1]
    var l = msg.length/4 + 2; // length (in 32-bit integers) of msg + ‘1’ + appended length
    var N = Math.ceil(l/16);  // number of 16-integer-blocks required to hold 'l' ints
    var M = new Array(N);

    for (var i=0; i<N; i++) {
        M[i] = new Array(16);
        for (var j=0; j<16; j++) {  // encode 4 chars per integer, big-endian encoding
            M[i][j] = (msg.charCodeAt(i*64+j*4)<<24) | (msg.charCodeAt(i*64+j*4+1)<<16) | 
                      (msg.charCodeAt(i*64+j*4+2)<<8) | (msg.charCodeAt(i*64+j*4+3));
        } // note running off the end of msg is ok 'cos bitwise ops on NaN return 0
    }
    // add length (in bits) into final pair of 32-bit integers (big-endian) [§5.1.1]
    // note: most significant word would be (len-1)*8 >>> 32, but since JS converts
    // bitwise-op args to 32 bits, we need to simulate this by arithmetic operators
    M[N-1][14] = ((msg.length-1)*8) / Math.pow(2, 32); M[N-1][14] = Math.floor(M[N-1][14]);
    M[N-1][15] = ((msg.length-1)*8) & 0xffffffff;


    // HASH COMPUTATION [§6.1.2]

    var W = new Array(64); var a, b, c, d, e, f, g, h;
    for (var i=0; i<N; i++) {

        // 1 - prepare message schedule 'W'
        for (var t=0;  t<16; t++) W[t] = M[i][t];
        for (var t=16; t<64; t++) W[t] = (Sha256.σ1(W[t-2]) + W[t-7] + Sha256.σ0(W[t-15]) + W[t-16]) & 0xffffffff;

        // 2 - initialise working variables a, b, c, d, e, f, g, h with previous hash value
        a = H[0]; b = H[1]; c = H[2]; d = H[3]; e = H[4]; f = H[5]; g = H[6]; h = H[7];

        // 3 - main loop (note 'addition modulo 2^32')
        for (var t=0; t<64; t++) {
            var T1 = h + Sha256.Σ1(e) + Sha256.Ch(e, f, g) + K[t] + W[t];
            var T2 =     Sha256.Σ0(a) + Sha256.Maj(a, b, c);
            h = g;
            g = f;
            f = e;
            e = (d + T1) & 0xffffffff;
            d = c;
            c = b;
            b = a;
            a = (T1 + T2) & 0xffffffff;
        }
         // 4 - compute the new intermediate hash value (note 'addition modulo 2^32')
        H[0] = (H[0]+a) & 0xffffffff;
        H[1] = (H[1]+b) & 0xffffffff; 
        H[2] = (H[2]+c) & 0xffffffff; 
        H[3] = (H[3]+d) & 0xffffffff; 
        H[4] = (H[4]+e) & 0xffffffff;
        H[5] = (H[5]+f) & 0xffffffff;
        H[6] = (H[6]+g) & 0xffffffff; 
        H[7] = (H[7]+h) & 0xffffffff; 
    }

    return Sha256.toHexStr(H[0]) + Sha256.toHexStr(H[1]) + Sha256.toHexStr(H[2]) + Sha256.toHexStr(H[3]) + 
           Sha256.toHexStr(H[4]) + Sha256.toHexStr(H[5]) + Sha256.toHexStr(H[6]) + Sha256.toHexStr(H[7]);
};


/**
 * Rotates right (circular right shift) value x by n positions [§3.2.4].
 * @private
 */
Sha256.ROTR = function(n, x) {
    return (x >>> n) | (x << (32-n));
};

/**
 * Logical functions [§4.1.2].
 * @private
 */
Sha256.Σ0  = function(x) { return Sha256.ROTR(2,  x) ^ Sha256.ROTR(13, x) ^ Sha256.ROTR(22, x); };
Sha256.Σ1  = function(x) { return Sha256.ROTR(6,  x) ^ Sha256.ROTR(11, x) ^ Sha256.ROTR(25, x); };
Sha256.σ0  = function(x) { return Sha256.ROTR(7,  x) ^ Sha256.ROTR(18, x) ^ (x>>>3);  };
Sha256.σ1  = function(x) { return Sha256.ROTR(17, x) ^ Sha256.ROTR(19, x) ^ (x>>>10); };
Sha256.Ch  = function(x, y, z) { return (x & y) ^ (~x & z); };
Sha256.Maj = function(x, y, z) { return (x & y) ^ (x & z) ^ (y & z); };


/**
 * Hexadecimal representation of a number.
 * @private
 */
Sha256.toHexStr = function(n) {
    // note can't use toString(16) as it is implementation-dependant,
    // and in IE returns signed numbers when used on full words
    var s="", v;
    for (var i=7; i>=0; i--) { v = (n>>>(i*4)) & 0xf; s += v.toString(16); }
    return s;
};


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */


/** Extend String object with method to encode multi-byte string to utf8
 *  - monsur.hossa.in/2012/07/20/utf-8-in-javascript.html */
if (typeof String.prototype.utf8Encode == 'undefined') {
    String.prototype.utf8Encode = function() {
        return unescape( encodeURIComponent( this ) );
    };
}

/** Extend String object with method to decode utf8 string to multi-byte */
if (typeof String.prototype.utf8Decode == 'undefined') {
    String.prototype.utf8Decode = function() {
        try {
            return decodeURIComponent( escape( this ) );
        } catch (e) {
            return this; // invalid UTF-8? return as-is
        }
    };
}


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
if (typeof module != 'undefined' && module.exports) module.exports = Sha256; // CommonJs export
if (typeof define == 'function' && define.amd) define([], function() { return Sha256; }); // AMD
