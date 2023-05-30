const myNotifications: { [key: string]: string } = {};
let pendingUrl = ""

chrome.notifications.onClicked.addListener((notificationId) => {
    if (myNotifications.hasOwnProperty(notificationId)) {
        const url = myNotifications[notificationId];

        chrome.tabs.query({ url }, (tabs) => {
            if (tabs.length && tabs[0].id) {
                chrome.tabs.update(tabs[0].id, { active: true });
            } else {
                chrome.tabs.create({ url });
            }
            chrome.notifications.getAll((notifications) => {
                for (const key in notifications) {
                    chrome.notifications.clear(key);
                }
            })
        });
    }
});

chrome.runtime.onMessage.addListener((request) => {
    if (!request.url || pendingUrl) return;
    pendingUrl = request.url
});


chrome.webRequest.onCompleted.addListener(
    () => {
        chrome.storage.sync.get(['notification'], (result) => {
            if (!result.notification) return;
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icon.png',
                title: 'GPT has responded!',
                message: 'Click to check the content.'
            }, (notificationId) => {
                myNotifications[notificationId] = pendingUrl;
                pendingUrl = "";
            });
        });
    },
    { urls: ["https://chat.openai.com/backend-api/conversation"] }
);

