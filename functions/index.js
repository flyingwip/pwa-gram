const functions = require("firebase-functions");
var admin = require("firebase-admin");
var cors = require("cors")({ origin: true });
var webpush = require("web-push");

var serviceAccount = require("./pwagram-firebase-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL:
    "https://pwagram-a8ef2-default-rtdb.europe-west1.firebasedatabase.app/",
});

exports.storePostData = functions.https.onRequest(function (request, response) {
  cors(request, response, function () {
    admin
      .database()
      .ref("posts")
      .push({
        id: request.body.id,
        title: request.body.title,
        location: request.body.location,
        image: request.body.image,
      })
      .then(function () {
        webpush.setVapidDetails(
          "mailto:martijnwip@gmail.com",
          "BIuJhON2ddvj-44508oIOnkHIhEhcWAPTMqiT3-tGs75H2-CaCHx9sdqMs2bszStC5Ds-hMv4U4X6iMVcBu9mNg",
          "yKo0yvzifZgKd2RqaQJBGOiIvGJ4S9lqdrEtewY3MzM"
        );

        // get the subscription promise
        return admin.database().ref("subscriptions").once("value");
      })
      .then(function (subscriptions) {
        subscriptions.forEach(function (sub) {
          var pushConfig = {
            endpoint: sub.val().endpoint,
            keys: {
              auth: sub.val().keys.auth,
              p256dh: sub.val().keys.p256dh,
            },
          };

          webpush
            .sendNotification(
              pushConfig,
              JSON.stringify({
                title: "New Post",
                content: "New Post added!",
                openUrl: "/help",
              })
            )
            .catch(function (err) {
              console.log(err);
            });
        });
        response
          .status(201)
          .json({ message: "Data stored", id: request.body.id });
      })
      .catch(function (err) {
        response.status(500).json({ error: err });
      });
  });
});
