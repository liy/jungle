#!/usr/bin/env node

const Fuse = require('fuse.js');
const { spawn, exec } = require('child_process');
const me = require('./me.json');
const colleagues = require('./colleagues.json');
const tmp = require('tmp-promise');
const fs = require('fs');
const { getTasks } = require('./api');

const root = 'C:/Source/Bitbucket/ao.checkout';

function runUpdate(path) {
  return new Promise((resolve) => {
    console.log(`Updating strata in ${path}`);
    exec(
      `cd ${root}${path} && npm i @ao-internal/strata-css@beta -D`,
      (error, stdout, stderr) => {
        if (error) {
          console.warn(error);
        }
        console.log(`Updated strata in ${path}`);
        resolve(stdout ? stdout : stderr);
      }
    );
  });
}

(async () => {
  Promise.all([
    runUpdate('/src/BundleBuilder'),
    runUpdate('/src/Ao.Checkout.Website/Apps'),
    runUpdate('/src/Ao.Checkout.Website/Areas/Responsive/Apps'),
    runUpdate('/src/Ao.Checkout.Website/Themes/Clients/AOL'),
  ])
    .then(() => console.log('All done!'))
    .catch((err) => console.log(err));
})();
