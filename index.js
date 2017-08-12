'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const http = require('http')
const app = express()
const access_token = "EAAB9fIH7JVYBAOdQPVxrxrpEzr0FCjA5qy43GZCyjtOUgQWlFNBZCiZAn2CGnw9C6IZBO6zU3iZB5wCbyMkDko9Rzfw9clKFDe867pPcZCl7seBWGQ2kNuyE66wMO54nkUwHBCFLgPFxnR7tENGNOZAdz1E6Fz4sPbZAkjrd2RDIAIAhQGMwAoiR";
const apiaiApp = require('apiai')("cb9a11314db744ddb8813bef8496d059");
app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

// Index route
app.get('/', function (req, res) {
	res.send('Hello world, I am a chat bot')
})

// for Facebook verification
app.get('/webhook/', function (req, res) {
	if (req.query['hub.mode'] === 'subscribe' &&
		req.query['hub.verify_token'] === 'da-da-da-da-do-do-do-do') {
		res.send(req.query['hub.challenge'])
	}
	console.error("Failed validation. Make sure the validation tokens match.");
	res.sendStatus(403);
})
app.post('/webhook', function (req, res) {
  var data = req.body;

  // Make sure this is a page subscription
  if (data.object === 'page') {

    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach(function(entry) {
      var pageID = entry.id;
      var timeOfEvent = entry.time;

      // Iterate over each messaging event
      console.log(entry.messaging);
      entry.messaging.forEach(function(event) {
        if (event.message) {
          receivedMessage(event);
        } else if (event.postback) {
        	receivedPostback(event);
        } else {
          console.log("Webhook received unknown event: ", event);
        }
      });
    });

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know
    // you've successfully received the callback. Otherwise, the request
    // will time out and we will keep trying to resend.
    res.sendStatus(200);
  }
});
  
function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  // console.log("Received message for user %d and page %d at %d with message:", senderID, recipientID, timeOfMessage);
  // console.log(JSON.stringify(message));

  var messageId = message.mid;

  var messageText = message.text;
  var messageAttachments = message.attachments;

  if (messageText) {

    // If we receive a text message, check to see if it matches a keyword
    // and send back the example. Otherwise, just echo the text we received.
    switch (messageText) {
      case 'generic':
        sendGenericMessage(senderID);
        break;

      case 'menu':
        sendMenu(senderID);
        break;

      case 'View Leave Filed':
        getLeaveFiled(senderID);
        break;

      default:
        sendTextMessage(senderID, messageText);
    }
  } else if (messageAttachments) {
    sendTextMessage(senderID, "Message with attachment received");
  }
}

function sendGenericMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{
            title: "TimeAway Management",
            subtitle: "Time Away Program Manager (Employee Benefits) to develop and manage employee Absence and Insurance programs.",
            item_url: "https://www.facebook.com/",
            image_url: "http://messengerdemo.parseapp.com/img/rift.png",
            buttons: [{
              type: "web_url",
              url: "https://www.facebook.com/",
              title: "Login via Facebook"
            }, {
              type: "postback",
              title: "Login via Gmail",
              payload:"LOGIN_GMAIL"
            }, {
              type: "web_url",
              url: "https://www.facebook.com/",
              title: "Open Website",
            }],
          }]
        }
      }

    }
  };  

  callSendAPI(messageData);
}
function sendMenu(recipientId) {
  var messageData = {
    recipient: {
      id: 1
    },
    message:{
      
    }
  };

  callSendAPI(messageData);

}
function sendTextMessage(recipientId, messageText) {
  let apiai = apiaiApp.textRequest(messageText, {
    sessionId: 'tabby_cat' // use any arbitrary id
  });
  
  apiai.on('response', (response) => {
  let aiText = response.result.fulfillment.speech;
    request({
      url: 'https://graph.facebook.com/v2.6/me/messages',
      qs: {access_token: access_token},
      method: 'POST',
      json: {
        recipient: {id: recipientId},
        message: {text: aiText}
      }
    }, (error, response) => {
      if (error) {
          console.log('Error sending message: ', error);
      } else if (response.body.error) {
          console.log('Error: ', response.body.error);
      }
    });
 	});
 	apiai.end();

  // var messageData = {
  //   recipient: {
  //     id: recipientId
  //   },
  //   message: {
  //     text: messageText
  //   }
  // };

  // apiai.on('response', (response) => {
  // 	let aiText = response.result.fulfillment.speech;

  //   // Got a response from api.ai. Let's POST to Facebook Messenger
  //   // callSendAPI(messageData);
  // });

  // apiai.on('error', (error) => {
  //   console.log(error);
  // });

  // apiai.end();
  // console.log(messageData)
  // callSendAPI(messageData);
}
function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: access_token},
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      // console.log("Successfully sent generic message with id %s to recipient %s", messageId, recipientId);
    } else {
      console.error("Unable to send message.");
      console.error(response);
      console.error(error);
    }
  }); 
}
function receivedPostback(event) {
  console.log(event.postback.payload);
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfPostback = event.timestamp;

  // The 'payload' param is a developer-defined field which is set in a postback 
  // button for Structured Messages. 
  var payload = event.postback.payload;

  // console.log("Received postback for user %d and page %d with payload '%s' " + "at %d", senderID, recipientID, payload, timeOfPostback);


  // When a postback is called, we'll send a message back to the sender to 
  // let them know it was successful
  var person = {
  	name:"bryan",
  	gmail:"bryan@google.com"
  };
  createEmplyee(person,response=> {
  	// console.log(response.body);
  	sendTextMessage(senderID, "response");
  });
}
function createEmplyee(person){
  request({
    uri: 'https://sunnyside-67087.firebaseio.com/employee.json',
    method: 'POST',
    json: person
  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      return body.name;
    } else {
      console.error("Unable to send message.");
      console.error(response);
      console.error(error);
    }
  }); 	
}

function getLeaveFiled(recipientId) {
  var messageData = {
    "recipient":{
      "id":recipientId
    }, 
    "message": {
      "attachment": {
        "type": "template",
        "payload": {
          "template_type": "list",
          "top_element_style": "compact",
          "elements": [
            {
              "title": "10-Mar-2017 Tue(For Approval)",
              "subtitle": "Sick Leave"
            },
            {
              "title": "12-Mar-2017 Tue(Approved)",
              "subtitle": "Emergency Leave"
            },
            {
              "title": "14-Mar-2017 Tue(Canc)",
              "subtitle": "Vacant Leave"
            }
          ],
           "buttons": [
            {
              "title": "View More",
              "type": "postback",
              "payload": "payload"            
            }
          ]  
        }
      }
    }
  };

  callSendAPI(messageData);
}
// Spin up the server
app.listen(app.get('port'), function() {
	console.log('running on port', app.get('port'))
})