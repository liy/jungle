This is a collection of utility functions to work in AO basket and checkout jungle.

It contains following functionalities:

1. `jc` Generate commit message from Trello board
2. `jungle-note` Generate release note from Trelllo release candidate columns.
3. `jungle-match` Cross match Trello board to generate list of dangling(commits not in waiting for release) and orphan(commits does not have ticket number) commits.

# Instruction

1. Run `npm i -g` to install the cli
2. Run `jungle-setup` to setup the cli. You will need Trello key and Trello token: [https://trello.com/app-key](https://trello.com/app-key)

# Cross match

`jungle-match` needs an `-e, --end` which specifies the end of the history node for cross matching process. Usually it can be a tag, a hash: `jungle-match -e 1.2.10944`