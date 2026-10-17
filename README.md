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

## Using the marketplace plugins

`.claude/settings.json` declares the `home-ai-marketplace-learning` marketplace and enables
`sdd-engineering` for this project. Claude Code asks to install it the first time you trust the
folder; the three plugins it depends on are installed with it. The install can also be done by hand:

```
claude plugin marketplace add ochubey/home-ai-marketplace-learning
claude plugin install sdd-engineering@home-ai-marketplace-learning --scope project
```
