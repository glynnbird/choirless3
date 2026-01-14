#!/bin/bash
npx rolldown --format=es --file=../functions/api/list.js -- list.js
npx rolldown --format=es --file=../functions/api/add.js -- add.js
npx rolldown --format=es --file=../functions/api/del.js -- del.js
npx rolldown --format=es --file=../functions/api/get.js -- get.js
npx rolldown --format=es --file=../functions/api/vidput.js -- vidput.js
npx rolldown --format=es --file=../functions/api/vidget.js -- vidget.js
npx rolldown --format=es --file=../functions/api/viddel.js -- viddel.js
