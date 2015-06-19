/* Creates an alert dialog */
kilo.service('Alerts', function($ionicPopup) {
    this.showAlert = function(title,template) {
        return $ionicPopup.alert({
                title: title,
                template: template
        });
    };
 
    this.method2 = function() {
            //..
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
kilo.factory('GetUserUUID', function ($resource, SessionToken) {
    "use strict";
    var session_id = sessionStorage.getItem('session_id');
    return $resource('http://dreamfactory.kilo.bitnamiapp.com:80/rest/kilo_db/users/:uuid/?app_name=kilo&fields=*', 
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

kilo.factory('SessionToken', function ($resource) {
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

    var resource = Session.post(
                            {
                              "email": "kilo_user_api@kiloapp.com",
                              "password": "thosoola3",
                              "duration": 0
                            }
    );

    return  {
        getToken: function() { 
            return resource.$promise.then(function (result) {
                return result.session_id;
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
                        update: 
                            { 
                            method  : 'PUT' 
                        }, 
                        post: {
                            method  : 'POST',
                            isArray : false,
                            headers : {'X-DreamFactory-Session-Token': session_id } 
                        } 
                });
            });
        }
    }
    
});





