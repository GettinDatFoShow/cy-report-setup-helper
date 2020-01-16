# What is this?

Setup script that helps users of Cypress.io && Cloud Foundry Automatically set up their folder/project structure so that their finished Mochawesome reports are public for them to go back and view statically. 

# Installation
`npm i cy-report-setup-helper --save-dev`

Then in the command line run..

`npx cy-helper-generate && npm i`

This should...
- add the needed devDependencies npm packages for mocha, mochawesome, mochawesome-report-generator, npm-run-all, and directory-tree.
- set up the scripts needed for mocha report generation and placement
- add the cypress settings for the mocha reporter and output videos/screenshots folders.

Then add the script `test:create-reports` to your build script or test run by calling `npm run test:create-reports`. 

# Extra Info
by default the `test:create-reports` script assumes that a `start` script exists and is set up for a live developement server which will run the UI code. This can be changed to fit your needs by altering the `test:cy` script in your package.json.

cy-report-setup-helper assumes you already have cypress added to your project and thus already have a cypress.json file. If a cypress.json file is not present, the script will fail.