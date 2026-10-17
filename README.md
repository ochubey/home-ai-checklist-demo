# home-ai-checklist-demo

A tiny checklist command line tool. It is a practice target for the plugins in
[home-ai-marketplace-learning](https://github.com/ochubey/home-ai-marketplace-learning).

```
node checklist.mjs add "buy milk"
node checklist.mjs list
node checklist.mjs toggle 1
npm test
```

Items are stored in `checklist.json` (override with `CHECKLIST_FILE`). No dependencies; Node 22.
