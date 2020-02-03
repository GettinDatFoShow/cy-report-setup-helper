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

# devDependencies added to your package.json
```
{
    "cypress":"^3.8.3"
    "mocha": "^5.2.0",
    "mochawesome": "^4.1.0",
    "mochawesome-merge": "^2.0.1",
    "mochawesome-report-generator": "^4.1.0",
    "npm-run-all": "^4.1.5",
    "directory-tree": "^2.2.4",
    "yargs": "^15.1.0",
    "json-beautify": "^1.1.1"
}
```
# scripts added to your package.json
```
{
    "cleanup:all": "run-p cleanup:reports cleanup:evidence",
    "cleanup:reports": "rm -fr <output-dir>/integration/public/report* && rm -fr <output-dir>/integration/report*",
    "cleanup:evidence": "rm -fr <output-dir>/integration/public/videos* && rm -fr <output-dir>/integration/public/screenshots*",
    "merge_reports": "mochawesome-merge --reportDir=<output-dir>/integration/reports/mocha > <output-dir>/integration/public/report.json",
    "generate_html_report": "marge <output-dir>/integration/public/report.json -f report -o <output-dir>/integration/public/",
    "test:cy": "run-p --race --silent start test-no-exit",
    "cy:run": "cypress run",
    "test-no-exit": "npm run cy:run --force" 
    "test:create-reports": "run-s cleanup:all test:cy merge_reports generate_html_report create-tree",
    "create-tree": "node <output-dir>/integration/cy-report-tree-generator.js --path=<output-dir>/"
}
```