/* Creates an alert dialog */
kilo.service('Alerts', function($ionicPopup,$location) {
    this.showAlert = function(title,template) {
        return $ionicPopup.alert({
                title: title,
                template: template
        });
    };
 
    this.showDialog = function(title,template) {
           var confirmPopup = $ionicPopup.confirm({
             title: title,
             template: template
           });
           confirmPopup.then(function(res) {
             if(res) {
               // ok
             } else {
               // cancel
             }
           });
           return confirmPopup;
    };
});

/* Check valid UUID and Session */
// kilo.service('Session', function ($resource, $localStorage, $location) {
//     "use strict";

//     var active = false;

//     this.reset = function() {
//         if($localStorage.$reset()) {
//             sessionStorage.removeItem('session_id');
//             // delete $scope.$storage.x;
//             $location.path("/login");
//         }
//     }

//     this.checkCreateUUID = function() {
//         if($localStorage.hasOwnProperty("uuid") !== true) {
//                     $location.path("/login");
//         } 
//     }

//     this.checkCreateSession = function() {

//     	/* If a session isn't already active, create one for this user */
//     	if(!sessionStorage.getItem('session_id')) {
//     		alert('james');
//     		var Session = $resource('http://dreamfactory.kilo.bitnamiapp.com:80/rest/user/session/?app_name=kilo', 
// 		        {
// 				  "email": '@email',
// 				  "password": '@password',
// 				  "duration": '@duration'
// 				}, 
// 		        { 
// 		            post: {
// 		                method: 'POST',
// 		                isArray: false
// 		            } 
// 		        }
// 	    	);
// 	    	return Session.post(
// 		    		{
// 					  "email": "kilo_user_api@kiloapp.com",
// 					  "password": "thosoola3",
// 					  "duration": 0
// 					}, function(success) {
// 						  sessionStorage.setItem('session_id',success.session_id);
// 						  alert("John "+success.session_id);
// 	                   }, 
// 	                   function(error) {
	                      
// 	            	   }
// 	        );
// 	    } /* end if Session not found */ 
//     }; /* end create session */
// });

/* Creates a user session */
/*kilo.factory('CreateSession', function ($resource) {
    "use strict";
    this.reset = function() {
        if($localStorage.$reset()) {
            sessionStorage.removeItem('session_id');
            // delete $scope.$storage.x;
            $location.path("/login");
        }
    }

    this.checkCreateUUID = function() {
        if($localStorage.hasOwnProperty("uuid") !== true) {
                    $location.path("/login");
        } 
    }
    return $resource('http://dreamfactory.kilo.bitnamiapp.com:80/rest/user/session/?app_name=kilo&email=kilo_user_api@kiloapp.com&password=thosoola3&duration=0', 
        {
    		"email": '@email',
		    "password": '@password',
		    "duration": '@duration'
		}, 
		{ 
            post: {
                method: 'POST',
                isArray: false
            } 
		}
    );
});*/

/* Register User factory */
kilo.factory('RegisterUser', function ($resource, $location, $q, $ionicLoading, $localStorage, SessionToken, LogError) {
    "use strict";

    return  {
        createUser: function(data) { 

            /* Create a deferred promise object */
            var deferred = $q.defer();

            /* Check we have a valid session token first */
            var getToken = SessionToken.getToken().then(function (session_id) {

                /* We have successfully received a session token */
                var api = $resource('http://dreamfactory.kilo.bitnamiapp.com:80/rest/kilo_db/users/?app_name=kilo', 
                    {
                        fid         : '@fid',
                        uuid        : '@uuid',
                        name        : '@name',
                        gender      : '@gender',
                        email       : '@email',
                        first_name  : '@first_name',
                        last_name   : '@last_name'
                    }, 
                    { 
                        post: {
                            method  : 'POST',
                            isArray : false,
                            headers : { 'X-DreamFactory-Session-Token': session_id } 
                        } 
                });

                if(data.method=='post') {

                        return api.post({ 
                                            fid     : data.fid,
                                            uuid    : data.uuid,
                                            name    : data.name,
                                            gender  : data.gender,
                                            email   : data.email,
                                            first_name   : data.first_name,
                                            last_name    : data.last_name
                                        }, function(success) {
                                            /* User created */
                                            return deferred.resolve();
                                        }, function(error) {
                                            /* User not created or something bombed out */
                                            LogError.post( 
                                                {
                                                 status_code     : error.status,
                                                 status_text     : error.statusText,
                                                 api_method      : error.config.method,
                                                 url             : error.config.url,
                                                 error_message   : error.data.error[0].message,
                                                 service         : 'RegisterUser.createUser'
                                                }
                                            ).$promise.then(function(success) {
                                                /* Error successfully saved */
                                            }, function(rejection) {
                                                /* Error save rejected */
                                            });

                                            return deferred.reject(error);
                        });
                }

            /* We cannot get a session id */
            }, function(rejection) {

                        /* Store session error in our logs */
                        LogError.post( 
                            {
                             status_code     : rejection.status,
                             status_text     : rejection.statusText,
                             api_method      : rejection.config.method,
                             url             : rejection.config.url,
                             error_message   : rejection.data.error[0].message,
                             service         : 'GetUserFid.getFid'
                            }
                        ).$promise.then(function(success) {
                            /* Error successfully saved */
                        }, function(rejection) {
                            /* Error save rejected */
                        });

                        /* As something went wrong, make sure we delete their UUID stored as it could have been tampered with */
                        $localStorage.$reset();

                        /* Always redirect them to initiation page as Session Token has and we cannot get their UUID details failed */
                        $ionicLoading.hide();
                        
                        /* Session Factory will redirect them to the connection error page */
                        return deferred.reject(rejection);

            });

            /* Return overall error or success of creating a new user */
            return deferred.promise;

        }
    };
    
});

/* Returns a users record by fId */
kilo.factory('GetUserFid', function ($resource, $location, $q, $ionicLoading, $localStorage, SessionToken, LogError) {
    "use strict";
    
     return  {
        getFid: function(data) { 

            /* Create a deferred promise object */
            var deferred = $q.defer();

            /* Check we have a valid session token first */
            var getToken = SessionToken.getToken().then(function (session_id) {

                /* We have successfully received a session token */
                var api = $resource('http://dreamfactory.kilo.bitnamiapp.com:80/rest/kilo_db/users/:fid/?app_name=kilo&fields=*', 
                    {
                        id_field    : 'fid',
                        fid         : '@fid'
                    }, 
                    { 
                        update: { method: 'PUT' }, 
                        query: {
                            method  : 'GET',
                            isArray : false,
                            headers : {'X-DreamFactory-Session-Token': session_id} 
                        } 
                    }
                );

                if(data.method=='query') {

                        return api.query({ 
                                            fid: data.fid
                                        }, function(success) {
                                            /* User found */
                                            return deferred.resolve(success);
                                        }, function(error) {
                                            /* User not found or something bombed out */
                                            /* Usually this will be that the user account hasn't been found which is fine for new registrations, so don't record it as an error */
                                            if(error.status!='404') {
                                                LogError.post( 
                                                    {
                                                     status_code     : error.status,
                                                     status_text     : error.statusText,
                                                     api_method      : error.config.method,
                                                     url             : error.config.url,
                                                     error_message   : error.data.error[0].message,
                                                     service         : 'GetUserFid.getFid'
                                                    }
                                                ).$promise.then(function(success) {
                                                    /* Error successfully saved */
                                                }, function(rejection) {
                                                    /* Error save rejected */
                                                });
                                            }
                                            return deferred.reject(error);
                        });
                }

            /* We cannot get a session id */
            }, function(rejection) {

                        /* Store session error in our logs */
                        LogError.post( 
                            {
                             status_code     : rejection.status,
                             status_text     : rejection.statusText,
                             api_method      : rejection.config.method,
                             url             : rejection.config.url,
                             error_message   : rejection.data.error[0].message,
                             service         : 'GetUserFid.getFid'
                            }
                        ).$promise.then(function(success) {
                            /* Error successfully saved */
                        }, function(rejection) {
                            /* Error save rejected */
                        });

                        /* As something went wrong, make sure we delete their UUID stored as it could have been tampered with */
                        $localStorage.$reset();

                        /* Always redirect them to initiation page as Session Token has and we cannot get their UUID details failed */
                        $ionicLoading.hide();
                        
                        /* Session Factory will redirect them to the connection error page */

            });
            
            /* Return overall error or success of creating a new user */
            return deferred.promise;

        }
    };

});

/* Returns a users record by UUID */
kilo.factory('GetUserUUID', function ($resource, $location, $q, $ionicLoading, $localStorage, SessionToken, LogError, Alerts) {
    "use strict";
    
     return  {
        getUUID: function(data) { 

             /* Create a deferred promise object */
            var deferred = $q.defer();

            /* Check we have a valid session token first */
            var getToken = SessionToken.getToken().then(function (session_id) {

                /* We have successfully received a session token */
                var api = $resource('http://dreamfactory.kilo.bitnamiapp.com:80/rest/kilo_db/users/:uuid/?app_name=kilo&fields=*', 
                    {
                        id_field    : 'uuid',
                        uuid        : '@uuid'
                    }, 
                    { 
                        query: {
                            method  : 'GET',
                            isArray : false,
                            headers : {'X-DreamFactory-Session-Token': session_id} 
                        } 
                    }
                );

                if(data.method=='query') {
                        return api.query({ 
                                            uuid: data.uuid
                                        }).$promise.then(function(success) {
                                            /* Return the users info */
                                            return deferred.resolve(success);
                                        }, function(error) {

                                            /* Store UUID error in our logs */
                                            LogError.post( 
                                                {
                                                     status_code     : error.status,
                                                     status_text     : error.statusText,
                                                     api_method      : error.config.method,
                                                     url             : error.config.url,
                                                     error_message   : error.data.error[0].message,
                                                     service         : 'GetUserUUID.getUUID'
                                                }
                                            ).$promise.then(function(success) {
                                                /* Error successfully saved */
                                            }, function(rejection) {
                                                /* Error save rejected */
                                                //console.log(JSON.stringify(rejection));
                                            });

                                            var alert = Alerts.showAlert('Connection Error', 'Please log in again.' );

                                            /* As something went wrong, make sure we delete their UUID stored as it could have been tampered with */
                                            $localStorage.$reset();
                                            $ionicLoading.hide();
                                            $location.path("/login");

                        });
                }

            /* We cannot get a session id */
            }, function(rejection) {

                        /* As something went wrong with Session Token, make sure we delete their UUID stored as it could have been tampered with */
                        $localStorage.$reset();
                        $ionicLoading.hide();

                        /* Session Factory will redirect them to the connection error page */

            }); /* end SessionToken.getToken() */

            /* Return overall error or success of obtaining getting the user UUID */
            return deferred.promise;
        }
    };

});

/* Returns a users messages */
kilo.factory('GetUserMessages', function ($resource, SessionToken) {
    "use strict";
    var session_id = sessionStorage.getItem('session_id');
    alert(session_id);
    return $resource('http://dreamfactory.kilo.bitnamiapp.com:80/rest/kilo_db/users/:uuid/?app_name=kilo&related=messages_by_user_id', 
        {
            id_field 	: 'uuid',
            uuid 		: '@uuid'
        }, 
        { 
            update: { method: 'PUT' }, 
            query: {
                method  : 'GET',
                isArray : false,
                headers : {'X-DreamFactory-Session-Token': SessionToken.getToken} 
            } 
        }
    );
});

kilo.factory('LogError', function($resource) {

        /* Write the error log table */
        return $resource('http://dreamfactory.kilo.bitnamiapp.com:80/rest/kilo_db/errorlogs/?app_name=kilo', 
            {
                 status_code    : '@status_code',
                 status_text    : '@status_text',
                 api_method     : '@api_method',
                 url            : '@url',
                 error_message  : '@error_message',
                 service        : '@service'
            }, 
            { 
                post: {
                    method: 'POST',
                    isArray: false
                } 
            }
        );

});

kilo.factory('SessionToken', function ($resource,$q,$ionicLoading,$location,LogError,Alerts) {
    "use strict";

     var Session = $resource('http://dreamfactory.kilo.bitnamiapp.com:80/rest/user/session/?app_name=kilo&email=kilo_user_api@kiloapp.com&password=thosoola3&duration=0', 
        {
            "email": '@email',
            "password": '@password',
            "duration": '@duration'
        }, 
        { 
            post: {
                method: 'POST',
                isArray: false
            } 
        }
    );

    return  {
        getToken: function() { 

            /* Create a deferred promise object */
            var deferred = $q.defer();

            if(!sessionStorage.getItem('session_id')) {
                    var getSession = Session.post(
                                {
                                  "email": "kilo_user_api@kiloapp.com",
                                  "password": "thosoola3",
                                  "duration": 0
                                }
                    ).$promise.then(function(success) {
           
                            /* We've got a response from DreamFactory so return the session_id */
                            sessionStorage.setItem('session_id', success.session_id);
                            deferred.resolve(success.session_id);

                    }, function(rejection) {

                            /* Something went wrong */
                            var r = 'We are having difficulties connecting to your account. Please check your Internet connection.';
                            var response;

                            switch(rejection.status){
                                case 400:
                                    /* Bad Request - Request does not have a valid format, all required parameters, etc. */
                                    response = r;
                                    break;
                                case 401:
                                    /* Unauthorized Access - No currently valid session available. */
                                    response = r;
                                    break;
                                case 404:
                                    /* Not Found - Resource not found */
                                    response = r;
                                    break;
                                case 500:
                                    /* System Error - Specific reason is included in the error message */
                                    response = r;
                                    break;
                                default:
                                    response = r;
                                    break;
                            }

                            /* Next we need to return a user friendly error message, and the actual error to store in our logs */
                            LogError.post( 
                                {
                                 status_code     : rejection.status,
                                 status_text     : rejection.statusText,
                                 api_method      : rejection.config.method,
                                 url             : rejection.config.url,
                                 error_message   : rejection.data.error[0].message,
                                 service         : 'SessionToken.getToken'
                                }
                            ).$promise.then(function(success) {
                                /* Error successfully saved */
                            }, function(rejection) {
                                /* Error save rejected */
                            });

                            var alert = Alerts.showAlert('Connection Error', r );

                            /* No valid session, redirect them to connection error */
                            $location.path("/connection_error");

                            /* Important to send deferred.reject otherwise where you call the service will think it's been successful */
                            deferred.reject(rejection);

                    });
            } else {
                    /* Return the API session token id from sessionStorage */
                    var session_id = sessionStorage.getItem('session_id');
                    deferred.resolve(session_id);
            } /* end if we have a session_id */
            
             return deferred.promise;

        }
    }; 
    
});





