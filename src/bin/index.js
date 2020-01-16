#!/usr/bin/env node
const fs = require('fs');

const CYPRESS_FILE = fs.readFileSync('cypress.json', 'utf-8');
const PROJECT_PACKAGE_FILE = fs.readFileSync('package.json', 'utf-8');
const CY_REPORT_TREE_GENERATOR = fs.readFileSync('node_modules/cy-report-setup-helper/src/lib/cy-report-tree-generator.js', 'utf-8');

let cypressSettings = JSON.parse(CYPRESS_FILE);
let projectSettings = JSON.parse(PROJECT_PACKAGE_FILE);

const APP_NAME = projectSettings.name;
/** function to add aditional properties */
const addProjectProperty = (settingsFile, projectProperty, newProperty, instructions) => {
    if (settingsFile[projectProperty] === undefined) {
        settingsFile[projectProperty] = { };
    }
    console.log(settingsFile)
    settingsFile[projectProperty][newProperty] = instructions;
}

/** set up scripts */
addProjectProperty(projectSettings, 'scripts', 'cleanup:all', 'run-p cleanup:reports cleanup:evidence' );
addProjectProperty(projectSettings, 'scripts', 'cleanup:reports', 'rm -fr integration/public/report* && rm -fr integration/report*' );
addProjectProperty(projectSettings, 'scripts', 'cleanup:evidence', 'rm -fr integration/public/videos* && rm -fr integration/public/screenshots*');
addProjectProperty(projectSettings, 'scripts', 'merge_reports', 'mochawesome-merge --reportDir=integration/reports/mocha > integration/public/report.json');
addProjectProperty(projectSettings, 'scripts', 'generate_html_report', 'marge integration/public/report.json -f report -o integration/public/');
addProjectProperty(projectSettings, 'scripts', 'test:cy', 'run-p --race --silent start cy:run');
addProjectProperty(projectSettings, 'scripts', 'cy:run', 'cypress run');
addProjectProperty(projectSettings, 'scripts', 'test:create-reports', 'run-s cleanup:all test:cy merge_reports generate_html_report create-tree');
addProjectProperty(projectSettings, 'scripts', 'create-tree', 'node integration/d-tree-listing.js');

/** set up devDependancies */
addProjectProperty(projectSettings, 'devDependencies', 'mocha', '^5.2.0');
addProjectProperty(projectSettings, 'devDependencies', 'mochawesome', '^4.0.1');
addProjectProperty(projectSettings, 'devDependencies', 'mochawesome-merge', '^2.0.1');
addProjectProperty(projectSettings, 'devDependencies', 'mochawesome-report-generator', '^4.0.1');
addProjectProperty(projectSettings, 'devDependencies', 'npm-run-all', '^4.1.5');
addProjectProperty(projectSettings, 'devDependencies', 'directory-tree', '^2.2.3');

/** add cypress settings */
addProjectProperty(cypressSettings, 'reporterOptions', 'reportDir', 'integration/reports/mocha');
addProjectProperty(cypressSettings, 'reporterOptions', 'quiet', true);
addProjectProperty(cypressSettings, 'reporterOptions', 'html', false);
addProjectProperty(cypressSettings, 'reporterOptions', 'overwrite', false);
addProjectProperty(cypressSettings, 'reporterOptions', 'json', true);
cypressSettings['videosFolder'] = 'integration/public/videos';
cypressSettings['screenshotsFolder'] = 'integration/public/screenshots';
cypressSettings['videoCompression'] = false;
cypressSettings['reporter'] = 'mochawesome';

const integrationFolder = 'integration/';
const publicDirectoryPath = `integration/public/`;
const nginxPath = `integration/nginx/`;
const nginxConfPath = `integration/nginx/conf/`;
const nginxIncludesPath = `integration/nginx/conf/includes/`;
const videosPath = `integration/public/videos`;
const screenshotsPath = `integration/public/screenshots`;
const staticFileData = `root: public
location_includes: include/*.conf
`;
const headersConfData = 'add_header "Access-Control-Allow-Origin" "*";';
const paths = [integrationFolder, publicDirectoryPath, nginxPath, nginxConfPath, nginxIncludesPath, videosPath, screenshotsPath];
const manifestHeader = `---
applications:`;
let manifestAppInfo = `
- name: ${APP_NAME}cypress-reports
    random-route: false
    memory: 1G
    instances: 1
    path: ./integration
`;
const createDirectoryStructure = (path) => {
    console.log('** creating path for %s **', path);
    try {
        if(!fs.existsSync(path)) {
            fs.mkdirSync(path);
        } else {
            console.log(' - path exists..')
        }
    } catch (err) {
        console.error(err);
    }
};

const storeData = (data, fileName, path) => {
    console.log('** creating file for %s in %s **', fileName, path);
    try {
        if(path.length > 0) {
            if (!fs.existsSync(path)) {
                fs.mkdirSync(path);
            }
        }
    } catch (err) {
        console.log(err);
    }
    try {
        if (path.length > 0) {
            fs.writeFileSync(`${path}${fileName}`, data);
        } else {
            fs.writeFileSync(`${fileName}`, data);
        }
        console.log('__ File Created __')
    } catch (err) {
        console.error(err);
    }
;}

const storeManifest = (manifestInfo) => {
    console.log('** creating file for manifest.yml **');
    try {
        if(!fs.existsSync('manifest.yml')) {
            try {
                manifestAppInfo = `${manifestHeader}${manifestAppInfo}`;
                fs.writeFileSync('manifest.yml', manifestAppInfo);
                console.log('__ File Created __')
            } catch (err) {
                console.error(err);
            }
        } else {
            let currentManifest = fs.readFileSync('manifest.yml', 'utf-8');
            try {
                if(!currentManifest.includes(`${APP_NAME}cypress-reports`)) {
                    manifestAppInfo = `${currentManifest}
                    ${manifestAppInfo}`;
                    fs.writeFileSync(`manifest.yml`, manifestAppInfo);
                } else {
                    console.log(`manifest.yml already exists and includes ${APP_NAME}cypress-reports...`);
                }
            } catch(err) {
                console.error(err);
            }
        }
    } catch (err) {
        console.log(err);
    }
};

/** set up paths */
paths.forEach((path) => {
    createDirectoryStructure(path);
});

/** create files and store data */
storeData(JSON.stringify(projectSettings), 'package.json', '');
storeData(JSON.stringify(cypressSettings), 'cypress.json', '');
storeData(CY_REPORT_TREE_GENERATOR, 'cy-report-tree-generator.js', integrationFolder);
storeData(staticFileData, 'Staticfile', integrationFolder);
storeData(headersConfData, 'headers.conf', nginxIncludesPath);
storeManifest(manifestAppInfo);


