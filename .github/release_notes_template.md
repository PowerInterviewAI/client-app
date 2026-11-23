<img width="1854" height="239" alt="release-note" src="https://github.com/user-attachments/assets/7960077d-58c0-47ab-acc7-d1086cbef231" />

## What's Changed

### Subscriptions replace credits
* Power Interview AI now runs on subscriptions instead of credit packs. Every account gets one free hour on the free-tier model. After that, a prepaid pass gives unlimited interviews on the best model: Monthly ($25), Quarterly ($60, save 20%) or Annual ($180, save 40%)
* Passes are paid once with crypto and never renew automatically. Buying a new pass while one is active adds its time after the current end date
* Paid credits you already had are converted to subscription days automatically, so nothing you bought is lost
* The Buy Credits page is now the Subscription page: your current plan and end date (or the free time you have left), the three plans, and your payment history in days

### Your plan, at a glance
* The title bar, the stealth status panel and the home screen show your plan, for example "Monthly · Unlimited until Dec 30, 2026", or "Free · 45 mins free"
* In the last 3 days of a pass the title bar shows "Ends in N days" in yellow, and a reminder pops up at 3, 2 and 1 days left, and again when the pass ends, with a shortcut to the plans
* Subscribers no longer get low-balance warnings, and Mock Interview setup says "Unlimited with your subscription"

### Payments
* Clearer payment status: pay details disappear as soon as funds arrive, partial payments and refunds are shown correctly, and history stays on screen if a status check briefly fails
* Need a refund? The payment page now links straight to support
* Messages that used to talk about credits now talk about free time and plans, in English and Russian

### Interviews
* An account can run one interview at a time. Starting an interview on another device now ends the one on this device, with a message explaining why, instead of failing silently

---

## Having trouble to install?
Just use the command lines
- Windows
```
curl -L -o PowerInterviewAI-Setup-VERSION_PLACEHOLDER.exe https://github.com/PowerInterviewAI/client-app/releases/latest/download/PowerInterviewAI-Setup-VERSION_PLACEHOLDER.exe && start "" "PowerInterviewAI-Setup-VERSION_PLACEHOLDER.exe"
```
- MacOS (works on both Apple Silicon and Intel - picks the build matching `uname -m`)
```
SUF="-x64"; [ "$(uname -m)" = "arm64" ] && SUF="-arm64"; DMG="Power.Interview.AI-VERSION_PLACEHOLDER$SUF.dmg"; curl -L -o "$DMG" "https://github.com/PowerInterviewAI/client-app/releases/latest/download/$DMG" && open "$DMG"
```
