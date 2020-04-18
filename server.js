var express = require('express');        // call express
var app = express();                 // define our app using express
var bodyParser = require('body-parser');
var request = require('request-promise');
var http = require('https');
var moment = require('moment');
var router = express.Router();
var tokenType;
var accessToken;
var count;
var result;

app.use(bodyParser.json());
app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader('Access-Control-Allow-Headers','x-org,Access-Control-Allow-Origin,Access-Control-Allow-Methods,Access-Control-Allow-Headers,Access-Control-Allow-Credentials,Content-Type,Authorization');            
    res.setHeader('Access-Control-Allow-Credentials', true); 
    if ('OPTIONS' == req.method) {   
      res.send(200);    
    }else {   
      next();
    }
});
  
// all of our routes will be prefixed with /api
app.use('/api/analytics/queue/:queue', async (req, res) => {
    var queuename = req.params.queue;
    var oohcheck = await BusinessHoursCheck();
    if (oohcheck == 'open')
    {
    var answer = await Authorization(queuename);
    result = await getOnQueueUsers(queuename);
    }
    else
    {
        result = '0';
    }

    res.send(result);
});

async function BusinessHoursCheck()
{
    var date = new Date();
    //Establish Open/Closed Variable
    var currentStatus = "closed";
    let isdylight = moment().isDST();
    var hours = date.getUTCHours();
    //document.getElementById("demo").innerHTML = ("before check"   + hours );
    
    // Check DST
    if (isdylight == "true")
    {
     hours = date.getUTCHours() + 2;
    //document.getElementById("demo").innerHTML = ("inside if"   + hours );
    }
    else
    {
     hours = date.getUTCHours() + 1;
    //document.getElementById("demo").innerHTML = ("inside else"  + hours);
    }
    function getWeekDay(date) {
        var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        return days[date.getDay()]
    }
    var day = date.getDate()
    var weekdate = (getWeekDay(date))
    var year = date.getFullYear()
    var seconds = date.getSeconds();
    var minutes = date.getMinutes();
    //variables for business
    var days = {
        "Sunday": {
            "openTime": 9,
            "closeTime": 15
        },
        "Monday": {
            "openTime": 7,
            "closeTime": 17
        },
        "Tuesday": {
            "openTime": 7,
            "closeTime": 18
        },
        "Wednesday": {
            "openTime": 6,
            "closeTime": 22
        },
        "Thursday": {
            "openTime": 7,
            "closeTime": 21
        },
        "Friday": {
            "openTime": 4,
            "closeTime": 16
        },
        "Saturday": {
            "openTime": 7,
            "closeTime": 21
        }
    }
    var theDay = days[weekdate];
    var theTime = date.getHours();
    console.log(`CurrentStatus: ${theDay.openTime}`);
    //function statement
    if (hours >= theDay.openTime && hours < theDay.closeTime) {
        currentStatus = "open"
    }
    console.log(`Current Status1: ${theDay.closeTime}`);
return currentStatus;
}

async function getOnQueueUsers(queueName){
    var options = {
        url: 'https://api.mypurecloud.ie/api/v2/analytics/queues/observations/query',
        method: 'POST',
        headers: {
            'Authorization': tokenType + " " + accessToken
        },
        json: {
            "filter": {
                "type": "or",
                "predicates": [
                    {
                        "type": "dimension",
                        "dimension": "queueId",
                        "operator": "matches",
                        "value": "7b03fade-8fba-4744-bfff-6845772f3252"
                    }
                ]
            },
            "metrics": [
                "oOnQueueUsers"
               // "oOffQueueUsers"
            ]
        }
    }

    return request(options).then((body) => {
        console.log(`Queue Response: ${JSON.stringify(body)}`);
        if(body.results[0].data=='' || body.results[0].data==undefined)
        {
            console.log(`Queue Response1: ${JSON.stringify(body)}`);
            var count = '0';
            return count;
        }
        else{
        console.log(`Queue Response2: ${JSON.stringify(body.results[0].data)}`);
        var count = JSON.stringify(body.results[0].data[0].stats.count);
        return count;
        }
    }).catch((error) => {
        console.log(error);
        count = '-1';
       return count;
    })

}

function Authorization(queuename){
	secret = '0F_sxm09iWsQYqJQ5r2u4mK2Rf74CKe51zZ0XIMZiXM';//process.env.purecloud_secret;
    id = 'e49b4c44-5c6c-44f4-ae79-50a0556675e1';//process.env.purecloud_client_id;
    return request.post({ url: 'https://login.mypurecloud.ie/oauth/token', form: { grant_type: 'client_credentials' } },async function (err, httpResponse, body) {
		if (err == null) {
			tokenType = JSON.parse(body).token_type;
            accessToken = JSON.parse(body).access_token;
             return accessToken;
        }
    }).auth(id, secret, true)
    return false;
}

app.listen(3500);
console.log('App started on port number 3500');