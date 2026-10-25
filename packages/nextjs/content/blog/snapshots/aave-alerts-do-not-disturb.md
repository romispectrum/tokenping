# Data snapshot: aave-alerts-do-not-disturb

Every product fact and outside source used in `content/blog/aave-alerts-do-not-disturb.mdx` and its Czech translation
`content/blog/cs/upozorneni-aave-rezim-nerusit.mdx`, written 2026-10-25 against `main` at `4f8a9cd`. The guide uses no
on-chain figures. Re-check the help pages before any update: phone makers rename settings with each system version.

## 1. Product facts (code on `main`, read 2026-10-25)

| Claim in the guide | Where it comes from |
| --- | --- |
| Checks every 5 minutes | `constants/notifications.ts:40` (`NOTIFICATION_CHECK_INTERVAL_MINUTES = 5`), `vercel.json` cron `*/5 * * * *` |
| One message per chosen channel at every check while the health factor is below the threshold, no snooze, no "recovered" message | `services/notifications/runNotificationCheck.ts:149,159-162`; the setup guide's "How often will you be alerted?" |
| Telegram alerts are ordinary messages with sound | `services/telegram/sendTelegram.ts:93-101`: Bot API `sendMessage` with no `disable_notification` (default sound) and no `parse_mode` |
| /stop or blocking the bot unlinks the chat | `app/api/telegram/webhook/route.ts:76-81`; `runNotificationCheck.ts:169-178` deletes the link when the bot is blocked |
| First Signal alert arrives as a message request | Tokenping sends from its own Signal account (`docs/signal-server-fly.md`, `services/signal/sendSignal.ts`); the setup guide's Step 4 |
| Email subject "Aave Health Factor Alert - {network}", test subject "Tokenping test message - {network}" | `i18n/messages/notifications.ts:50,82`; Czech: "Upozornění na health factor Aave - {network}" (`:89`), "Testovací zpráva Tokenpingu - {network}" (`:125`) |
| One test per channel every 15 minutes | `constants/notifications.ts:43` (`TEST_SEND_COOLDOWN_MINUTES = 15`); the setup guide's Step 7 |
| The sender address is the one shown on the test email | `services/email/sendEmail.ts:6,51` reads `RESEND_FROM_EMAIL`; the production value is not in the repository, so the guide does not print it |

## 2. Outside sources (all fetched 2026-10-25)

| Claim | Source |
| --- | --- |
| Focus allowed apps: Settings > Focus > [Focus] > Allow Notifications From > Apps | Apple, [Set up a Focus](https://support.apple.com/guide/iphone/set-up-a-focus-iphd6288a67f/ios), [Allow or silence notifications for a Focus](https://support.apple.com/guide/iphone/allow-or-silence-notifications-for-a-focus-iph21d43af5b/ios) (pages for iOS 27) |
| Time Sensitive switch in a Focus; per-app Time Sensitive "if the app supports it"; Immediate Delivery vs Scheduled Summary | Apple, same Focus page and [Change notification settings](https://support.apple.com/guide/iphone/change-notification-settings-iph7c3d96bab/ios) |
| Neither Signal nor Telegram documents marking messages as time sensitive | Searched Signal Support and Telegram FAQ/blog: no statement either way, so the guide says "doesn't say" and advises adding the app |
| Sleep Focus follows the Health app's sleep schedule | Apple, [Turn Sleep Focus on or off](https://support.apple.com/guide/iphone/turn-sleep-focus-on-or-off-iph7cdb86325/ios) |
| Emergency Bypass is set in a contact's ringtone or text tone | Apple, [Change notifications](https://support.apple.com/guide/iphone/change-notifications-iph62faab6a4/ios) |
| Silent mode: notification sounds don't play | Apple, [If your iPhone doesn't ring or play sounds](https://support.apple.com/en-us/108781) (published 14 Sep 2026) |
| Signal on iPhone: Background App Refresh "Allows Signal to receive messages and calls on time"; Low Power Mode can interfere; Focus path to add Signal | Signal, [Permissions and OS Notification Settings](https://support.signal.org/hc/en-us/articles/360007062172), iOS tab, read in a browser (the site refuses scripted requests) |
| Pixel: Settings > Modes > Do Not Disturb > Notification filters > People / Apps; Bedtime is a separate mode | Google, [Pixel Help 6111295](https://support.google.com/pixelphone/answer/6111295) |
| Priority conversations still show in Do Not Disturb; Settings > Notifications > Conversations | Google, [Pixel Help 16786524](https://support.google.com/pixelphone/answer/16786524); only MessagingStyle conversation notifications qualify ([Android developers](https://developer.android.com/develop/ui/views/notifications/conversations)), so the guide says "if your chat is listed" |
| Notification cooldown softens sounds and pop-ups when many notifications arrive in a short time; calls, alarms, priority conversations and emergency alerts exempt; Settings > Notifications > Notification cooldown | Google, [Android Help 9079661](https://support.google.com/android/answer/9079661) |
| Adaptive Battery may delay notifications; Battery Saver may delay low-priority ones; Extreme Battery Saver pauses most apps | Google, [Pixel Help 7015477](https://support.google.com/pixelphone/answer/7015477), [6187458](https://support.google.com/pixelphone/answer/6187458) |
| Samsung: Allowed during Do not disturb; Deep sleeping apps never run in the background; Never sleeping apps under Background usage limits | Samsung US, [ANS10002889](https://www.samsung.com/us/support/answer/ANS10002889/), [ANS10003442](https://www.samsung.com/us/support/answer/ANS10003442/) |
| Signal on Android: exclude from battery optimization, unrestricted background data, Adaptive Battery off on Android 9+, allow during Do not disturb; check a linked Desktop hasn't already viewed the message; chat not muted | Signal, [Troubleshooting Notifications](https://support.signal.org/hc/en-us/articles/360007318711), read in a browser |
| Signal mute: 1 hour, 8 hours, 1 day, 7 days (1 week on iOS) or always | Signal, [Mute notifications](https://support.signal.org/hc/en-us/articles/360043273491) |
| Notification profiles: Android and Desktop only, schedule, purple icon, "not available on iOS at this time" | Signal, [Notification Profiles](https://support.signal.org/hc/en-us/articles/11314274992282) |
| Message requests: accept, delete or block; blocking stops notifications | Signal, [Message Requests](https://support.signal.org/hc/en-us/articles/360007459591) |
| Telegram: notifications on in Notifications and Sounds, importance high on Android, battery saver exceptions; viewed on another device or logged out means no notification | [Telegram FAQ](https://telegram.org/faq#notification-problems), [Telegram Support notifications fix](https://telegra.ph/Notifications-FIX) (10 Feb 2017) |
| Telegram per-chat mute, timed mute, notifications without sound; Exceptions list | Telegram blog, [16 Apr 2022](https://telegram.org/blog/notifications-bots), [27 Aug 2018](https://telegram.org/blog/export-and-more) |
| Gmail: Not spam, add sender to contacts, filter with "Never send it to Spam" (computer only); Updates tab description; app notifies Primary only by default; "High priority only" | Gmail Help [16457426](https://support.google.com/mail/answer/16457426), [3094499](https://support.google.com/mail/answer/3094499), [1075549](https://support.google.com/mail/answer/1075549) |
| Apple Mail VIP and VIP Alerts | Apple, [104971](https://support.apple.com/en-us/104971) (published 25 Mar 2026) |
| Outlook mobile notifies for Focused by default; notifications for all email; Always Move to Focused | Microsoft, [new message notifications](https://support.microsoft.com/en-us/office/why-don-t-i-get-new-message-notifications-8f1b83d5-c3ac-409f-9dbb-83668d1b01b2), [Focused Inbox in Outlook mobile](https://support.microsoft.com/en-us/office/focused-inbox-email-filter-in-outlook-mobile-d9af3f3a-3a7d-4898-8079-39df8924f8e1) |

## 3. Not claimed (could not be verified)

- Whether Signal or Telegram mark messages as Time Sensitive or Critical on iOS.
- Whether a Signal or Telegram chat appears under Android's priority conversations (depends on how each app posts notifications).
- What name Tokenping's Signal sender shows, and the production email sender address.
- Whether a pending Signal message request itself makes a sound.
