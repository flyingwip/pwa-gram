var deferredPrompt;
var enableNotificationButtons = document.querySelectorAll(
  ".enable-notifications"
);

if (!window.Promise) {
  window.Promise = Promise;
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/sw.js")
    .then(function () {
      console.log("Service worker registered!");
    })
    .catch(function (err) {
      console.log(err);
    });
}

window.addEventListener("beforeinstallprompt", function (event) {
  console.log("beforeinstallprompt fired");
  event.preventDefault();
  deferredPrompt = event;
  return false;
});

function displayConfirmNotification() {
  if ("serviceWorker" in navigator) {
    // service-worker registration is service-worker + notifications
    navigator.serviceWorker.ready.then(function (swreg) {
      var options = {
        body: "From now on you will receive our updates!",
        icon: "/src/images/icons/app-icon-96x96.png",
        image: "/src/images/sf-boat.jpg",
        dir: "ltr",
        lang: "en-US", // BCP 47
        vibrate: [100, 50, 200],
        badge: "/src/images/icons/app-icon-96x96.png",
        tag: "confirm-notification",
        renotify: true,
        actions: [
          {
            action: "confirm",
            title: "Okay",
            icon: "/src/images/icons/app-icon-96x96.png",
          },
          {
            action: "cancel",
            title: "Cancel",
            icon: "/src/images/icons/app-icon-96x96.png",
          },
        ],
      };
      swreg.showNotification("Succesfully subscribed (from SW)!", options);
    });
  }

  // var options = {
  //   body: "From now on you will receive our updates!",
  // };

  // new Notification("Succesfully subscribed", options);
}

function configurePushSub() {
  // if there is no support for servicworker then break
  if (!("serviceWorker" in navigator)) {
    return;
  }

  // make scope for sw-registry
  var reg;
  navigator.serviceWorker.ready
    .then(function (swreg) {
      reg = swreg;
      return swreg.pushManager.getSubscription();
    })
    .then(function (subscription) {
      if (subscription === null) {
        // create a new subscription
        // with protection so not every one can send messages
        // through the subscribtion. use vapid
        var vapidPubKey =
          "BIuJhON2ddvj-44508oIOnkHIhEhcWAPTMqiT3-tGs75H2-CaCHx9sdqMs2bszStC5Ds-hMv4U4X6iMVcBu9mNg";
        var convertedVapidPubKey = urlBase64ToUint8Array(vapidPubKey);
        return reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidPubKey,
        });
      } else {
        // We have a subscription
      }
    })
    .then(function (newSub) {
      fetch(
        "https://pwagram-a8ef2-default-rtdb.europe-west1.firebasedatabase.app/subscriptions.json",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(newSub),
        }
      )
        .then(function (res) {
          if (res.ok) {
            console.log(res);
            displayConfirmNotification();
          }
        })
        .catch(function (err) {
          console.log(err);
        });
    });
}

function askForNotificationPermission(event) {
  Notification.requestPermission(function (result) {
    console.log("User Choice", result);
    if (result !== "granted") {
      console.log("No notification permission granted!!");
    } else {
      // could hide button here
      configurePushSub();
      // displayConfirmNotification();
    }
  });
}

if ("Notification" in window && "serviceWorker" in navigator) {
  for (let i = 0; i < enableNotificationButtons.length; i++) {
    const btn = enableNotificationButtons[i];
    btn.style.display = "inline-block";
    btn.addEventListener("click", askForNotificationPermission);
  }
}
