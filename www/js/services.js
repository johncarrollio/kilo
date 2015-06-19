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
    }
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

/* Returns a users record by fId */
kilo.factory('GetUserFid', function ($resource, SessionToken) {
    "use strict";
    var session_id = sessionStorage.getItem('session_id');
    return $resource('http://dreamfactory.kilo.bitnamiapp.com:80/rest/kilo_db/users/:fid/?app_name=kilo&fields=*', 
        {
            id_field 	: 'fid',
            fid 		: '@fid'
        }, 
        { 
            update: { method: 'PUT' }, 
            query: {
                method 	: 'GET',
                isArray : false,
                headers : {'X-DreamFactory-Session-Token': SessionToken.getToken} 
            } 
        }
    );
});

/* Returns a users record by UUID */
kilo.factory('GetUserUUID', function ($resource, $location, $q, $ionicLoading, SessionToken) {
    "use strict";
    
     return  {
        getUUID: function(data) { 

            return SessionToken.getToken().then(function (session_id) {

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
                                        }, function(success) {
                                            return success;
                                        }, function(error) {
                                            $ionicLoading.hide();
                                            $location.path("/login");
                                            return $q.reject(error);
                        }).$promise;
                }

                /* We cannot get a session id */
            }, function(rejection) {

                        /* As something wet wrong, make sure we delete their UUID stored as it could have been tampered with */
                        $localStorage.$reset();

                        /* Something went wrong */
                        var r = 'We could not retrieve your account details.';

                        switch(rejection.status){
                            case 400:
                                /* Bad Request - Request does not have a valid format, all required parameters, etc. */
                                var response = r
                            case 401:
                                /* Unauthorized Access - No currently valid session available. */
                                var response = r
                            case 404:
                                /* Not Found - Resource not found */
                                var response = r
                                break;
                            case 500:
                                /* System Error - Specific reason is included in the error message */
                                var response = r
                                break;
                            default:
                                var response = r
                                break;
                        }

                        /* Next we need to return a user friendly error message, and the actual error to store in our logs */
                        LogError.post( 
                            {
                             display_message : response,
                             status_code     : rejection.status,
                             status_text     : rejection.statusText,
                             method          : rejection.config.method,
                             url             : rejection.config.url,
                             error_message   : rejection.data.error[0].message,
                             service         : 'GetUserUUID.getUUID'
                            }
                        ).$promise.then(function(success) {
                            /* Error successfully saved */
                        }, function(rejection) {
                            /* Error save rejected */
                        });

                        /* Always redirect them to login page as UUID has failed */
                        $ionicLoading.hide();
                        $location.path("/login");

                });
        }
    }

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
                 display_message : '@display_message',
                 status_code     : '@status_code',
                 status_text     : '@status_text',
                 method          : '@method',
                 url             : '@url',
                 error_message   : '@error_message',
                 service         : '@service'
            }, 
            { 
                post: {
                    method  : 'POST',
                    isArray : false
                } 
            }
        );

});

kilo.factory('SessionToken', function ($resource,$q,$ionicLoading,LogError,Alerts) {
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
                return Session.post(
                            {
                              "email": "kilo_user_api@kiloapp.com",
                              "password": "thosoola3",
                              "duration": 0
                            }
                ).$promise.then(function(success) {
                        /* We've got a response from DreamFactory so return the session_id */
                        sessionStorage.setItem('session_id', success.session_id);
                        return success.session_id;

                }, function(rejection) {

                        /* Something went wrong */
                        var r = 'We are having difficulties connecting to your account.';
                        switch(rejection.status){
                            case 400:
                                /* Bad Request - Request does not have a valid format, all required parameters, etc. */
                                var response = r
                            case 500:
                                /* System Error - Specific reason is included in the error message. */
                                var response = r
                                break;
                            default:
                                /* System Error - Specific reason is included in the error message. */
                                var response = r
                                break;
                        }

                        /* Next we need to return a user friendly error message, and the actual error to store in our logs */
                        LogError.post( 
                            {
                             display_message : response,
                             status_code     : rejection.status,
                             status_text     : rejection.statusText,
                             method          : rejection.config.method,
                             url             : rejection.config.url,
                             error_message   : rejection.data.error[0].message,
                             service         : 'SessionToken.getToken'
                            }
                        ).$promise.then(function(success) {
                            /* Error successfully saved */
                        }, function(rejection) {
                            /* Error save rejected */
                        });

                        /* Important to send $q.reject otherwise where you call the service will think it's been successful */
                        return $q.reject(response);

                });

        }
    }    
    
});

/* Register User factory */
kilo.factory('RegisterUser', function ($resource, SessionToken) {
    "use strict";

    return  {
        registerUser: function() { 
            return SessionToken.$promise.then(function (session_id) {
                /* We have successfully received a session token */
                return $resource('http://dreamfactory.kilo.bitnamiapp.com:80/rest/kilo_db/users/?app_name=kilo', 
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
                            headers : {'X-DreamFactory-Session-Token': session_id } 
                        } 
                });
                /* We cannot get a session id */
            }, function(error) {
                    $ionicLoading.hide();
                    var alert = Alerts.showAlert('Registration Error', 'Please try registering again.');
            });
        }
    }
    
});





