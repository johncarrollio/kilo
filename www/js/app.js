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

// ionic emulate ios --livereload --consolelogs --serverlogs --target="iPhone-5"

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
        .state('dashboard', {
            url: '/dashboard',
            templateUrl: 'templates/dashboard.html'
        })
        .state('feed', {
            url: '/feed',
            templateUrl: 'templates/feed.html'
        })
        .state('messages', {
            url: '/messages',
            templateUrl: 'templates/messages.html'
        })
        .state('connection_error', {
            url: '/connection_error',
            templateUrl: 'templates/connection_error.html'
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

kilo.controller("ConnectionErrorController", function($scope, $localStorage, $location, $ionicLoading) {


});

kilo.controller("DashboardController", function($scope, $localStorage, $location, $ionicLoading, $ionNavView, $ionNavButtons) {


});

kilo.controller("InitController", function($scope, $localStorage, $location, $ionicLoading, $rootScope, $ionicPopup, $window, GetUserUUID, Alerts, SessionToken, LogError) {
    $scope.init = function() {

            $localStorage.uuid = '0131c42332ba7f51795e9412a8a9f3c38f73e39099f2fd9da30752d83726ec55';
            /* Inititate a DreamFactory session */
            var setSession = function() {
                /* Get the session token from our SessionToken service factory */
                SessionToken.getToken() 
                    /* When SessionToken.getToken returns a session id */
                    .then(function(data) {
                        /* Promise fulfilled and session verified */
                        /* Have they already got a UUID stored in localStorage? */
                        if($localStorage.hasOwnProperty("uuid") === true) {
                                /* Let's attempt to get the user from the DB, if UUID is incorrect send them back to login */
                                var getUUID = GetUserUUID.getUUID({   
                                                        method: 'query',
                                                        uuid: $localStorage.uuid
                                                    }).then(function(success) {
                                                        /* We've found the user! Let's redirect them to their dashboard */
                                                        $ionicLoading.hide();
                                                        $location.path("/dashboard");
                                                    }, function(error) {
                                                        /* getUUID Service will automatically redirect them to the login page if UUID check fails */
                                });

                        } else {
                                /* We need a UUID before we know who they are */
                                $localStorage.$reset(); // for good measure
                                $ionicLoading.hide();
                                $location.path("/login");
                        }

                    }, function(error) {

                        /* We couldn't get a valid session_id, SessionToken service will display an alert and redirect them to the connection error page  */
                        $ionicLoading.hide();

                        /*var confirmPopup = $ionicPopup.confirm({
                             title: 'Internet Connectivity Problem',
                             template: error,
                             buttons: [
                                  {
                                    text: '<b>Try again</b>',
                                    type: 'button-positive',
                                    onTap: function(e) {
                                      $window.location.reload();
                                    }
                                  },
                                  { text: 'Cancel',
                                    onTap: function(e) {
                                      $location.path('/connection_error');
                                    } 
                                  }
                            ]
                        });*/

                });
            };
            setSession();
            var loading = $ionicLoading.show({content: 'Logging you in'});
       
    };
    $scope.init();
});

kilo.controller("LoginController", function($scope, $http, $cordovaOauth, $localStorage, $location, $ionicPopup, $ionicLoading, RegisterUser, GetUserFid, GetUserUUID, Alerts) {

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

                    /* We've obtained user details from Facebook */
                    }).then(function(result) {
                        
                        /* Find the user in our DB */
                        var getUser = GetUserFid.getFid(
                                { 
                                   method: 'query',
                                   fid: result.data.id
                                }).then(function(success) {

                                    /* Re-save their uuid */
                                    $ionicLoading.hide();
                                    $localStorage.uuid = success.uuid;
                                    $location.path("/profile");

                                /* User not found in our DB so set them up a new account */
                                }, function(error) {

                                    var registerUser = RegisterUser.createUser({ 
                                           method: 'post',
                                           fid: result.data.id,
                                           uuid: Sha256.hash(result.data.id),
                                           name: result.data.name,
                                           gender: result.data.gender,
                                           email: result.data.email,
                                           first_name: result.data.first_name,
                                           last_name: result.data.last_name
                                        }).then(function(success) {
                                           /* Log them in */
                                           $ionicLoading.hide();
                                           $localStorage.uuid = Sha256.hash(result.data.id);
                                           $location.path("/dashboard");
                                        }, function(error) {
                                           /* Trouble registering their account */
                                           $ionicLoading.hide();
                                           var alert = Alerts.showAlert('Oh rats!', 'We had trouble registering your account. Maybe due to a connection problem. Please try again.');
                                           $location.path("/login");
                                    });

                        });

                    }, function(error) {
                        $ionicLoading.hide();
                        $scope.showAlert = function() {
                           var alertPopup = $ionicPopup.alert({
                             title: 'Oh rats!',
                             template: 'We had trouble accessing your Facebook profile information. Please log in again.'
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
                        template: 'We had trouble connecting to your Facebook profile information. Please log in again.'
                    });
                    $location.path("/login");
                }

            }, function(error) {
                var alertPopup = $ionicPopup.alert({
                    title: 'Oh rats!',
                    template: 'We had trouble connecting to your Facebook profile information. Please log in again.'
                });
                $location.path("/login");
            });
        };
    } else {

        /* Let's attempt to get the user from the DB, if UUID is incorrect send them back to login */
        var getUUID = GetUserUUID.getUUID({   
                                method: 'query',
                                uuid: $localStorage.uuid
                            }).then(function(success) {
                                /* We've found the user! Let's redirect them to their dashboard */
                                $ionicLoading.hide();
                                $location.path("/dashboard");

                            }, function(error) {
                                /* getUUID Service will automatically redirect them to the login page if UUID check fails */
        }); /* end getUUID */
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