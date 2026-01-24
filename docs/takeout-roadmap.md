# Takeout Roadmap

This is for the maintainers of this Takeout starter kit repo to track upcoming tasks, you may remove or keep if you want to track our tasks.

v1:

- ci/cd:
  - sst working and tested for aws setup
  - working actions to build to both app stores
    - can have eas and self-hosted options

- cleanup:
  - zero migrations cleanup and move into package

post  v1:

- zero error/rollback handling
- push notifications
- job system
- automated database backups on releases

---

# backlog

- "Customize web server port"
  - i can't find a way to make the native app default to a different port
    shockingly so this is sort of bad, i'd love to keep it though else we should
    disable before release

- Resend Code should be actually stored on the server - if i refresh the page it
  just counts down from 30 again when in fact i've waited already which is
  annoying
  - OTP isn't auto-submitting on paste
  - {"code":"INVALID_OTP","message":"Invalid OTP"} getting this but used right
    code

- we need to support / message about rebuilding the native app for a different
  port if they want something other than 8081
  - likewise i'd like there to be way less areas to touch when doing so

- can we prevent vscode autocomplete of external overlaps:
  - Image, Link, Dialog

quan:

- remove public/images/\* i think
- `eb.and(draftCondition, notFromBlockedUsers)` cant bring blocked down to
  client like this
  - we'd need to have a separate generated feed need to discuss
