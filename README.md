# What is this?

cy-report-setup-helper is a setup script that helps users of Cypress.io automatically set up their folder/project structure so that their tests generate a finished Mochawesome report. If the cloud foundry flag is set to true, then the appropiate files will be public for them to go back and view teir reports statically via an integration folder. 

# Installation
`npm i cy-report-setup-helper --save-dev`

Then in the command line run..

`npx cy-helper-generate --output-dir=<desired directory> --cloud-foundry=<true/false>`

After running this command run npm install to install the added dependecies..

`npm install` 

This should...
- add the needed devDependencies npm packages for mocha, mochawesome, mochawesome-report-generator, npm-run-all, and directory-tree.
- set up the scripts needed for mocha report generation and placement
- add the cypress settings for the mocha reporter and output videos/screenshots folders.

Then add the script `test:create-reports` to your build script or test run by calling `npm run test:create-reports`. 

# Extra Info
by default, the --output-dir flag will create 'integration/' folder at the top level of your project. 
by default, the --cloud-foundry flag is set to false. If set to true, cy-report-setup-helper will create or add the needed manifest.yml information for the integration report directory. It will also create the require staticFile and nginx configuration to set the mochawesome report html and cypress videos/screenshots to public for CORS requests after uploading to cloud foundry.
by default the `test:create-reports` script assumes that a `start` script exists and is set up for a live developement server which will run the UI code. This can be changed to fit your needs by altering the `test:cy` script in your package.json.
.