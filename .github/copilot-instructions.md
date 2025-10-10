## User Confirmation Rule (UCR): Before you set a conversation or task status as "stop" or "done", ALWAYS ASK ME to confirm if anything I need 1st by running command execution tool with command (NEVER FORGET to run this EXECUTION TOOL and WAIT ME TO INPUT, DO NOT STOP/EXIT the conversation):
```powerhell
$input = Read-Host "Anything else you need or any issue, let me know, I will fulfill or fix it, otherwise just say 'done'"
```
- If anything I need or any issue, you should fulfill or fix it.
- Otherwise If I say "done", then you can set the conversation or task status as "stop" or "done".