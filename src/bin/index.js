#!/usr/bin/env node
const fs = require('fs');
const beautify = require('json-beautify');
const  CYPRESS_FILE =  "{}";
const flags = [
    '--output-dir=some/new/dir (for the output of the integration folder, top level project folder by default)',
    '--cloud-foundry=true/false (set to true if useing Cloud Foundry)',
    'help, -h',
    'version, -v'
]

const checkFlags = (argv) => {
    if (argv.v || argv.version) {
        const version = JSON.parse(fs.readFileSync('package.json', 'utf-8')).version;
        console.log('version - ' + version);
    } else if (argv.h || argv.help) {
        console.log('Thanks For using Cy-report-setup-helper!');
        console.log('');
        console.log('Information ----- ')
        console.log('');
        console.log('   Built to help users of Cypres.io automatically get all the packages they need for an automatic Mochawesome after test report.');
        console.log('   If the Cloud Foundry flag is set to true, cy-report-setup-helper will help set the integration folder to public and add the proper manifest file.');
        console.log('       Developed by Robert Morris, please feel free to help colaborate.')
        console.log('');
        console.log('Flags -----')
        console.log('');
        flags.forEach(flag => {
            console.log('   '+flag);
        });
        console.log('');
    } 
}

const argv = require('yargs')
    .command('*', 'default runner', (yargs) => {}, (argv) => {
    checkFlags(argv);
    }).argv;

let outputDir = '';
let isCloudFoundry = false;

if (!!argv.outputDir) {
    outputDir = argv.outputDir;
    if (!outputDir.endsWith('/')) {
        outputDir = outputDir + '/';
    }
    if (outputDir.startsWith('/')) {
        outputDir = outputDir.substring(1);
    }
    console.log('output-dir = '+ outputDir);
} 
if (argv.cloudFoundry === 'true') {
    isCloudFoundry = true;
}

try {
    CYPRESS_FILE = fs.readFileSync('cypress.json', 'utf-8');
} catch (e) {
    console.error('No Cypress.json File.. Generating new');
} 
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
addProjectProperty(projectSettings, 'scripts', 'cleanup:reports', 'rm -fr ' + outputDir + 'integration/public/report* && rm -fr ' + outputDir + 'integration/report*' );
addProjectProperty(projectSettings, 'scripts', 'cleanup:evidence', 'rm -fr ' + outputDir + 'integration/public/videos* && rm -fr ' + outputDir + 'integration/public/screenshots*');
addProjectProperty(projectSettings, 'scripts', 'merge_reports', 'mochawesome-merge --reportDir=' + outputDir + 'integration/reports/mocha > ' + outputDir + 'integration/public/report.json');
addProjectProperty(projectSettings, 'scripts', 'generate_html_report', 'marge ' + outputDir + 'integration/public/report.json -f report -o ' + outputDir + 'integration/public/');
addProjectProperty(projectSettings, 'scripts', 'test:cy', 'run-p --race --silent start test-no-exit');
addProjectProperty(projectSettings, 'scripts', 'cy:run', 'cypress run');
addProjectProperty(projectSettings, 'scripts', 'test-no-exit', 'npm run cy:run --force');
addProjectProperty(projectSettings, 'scripts', 'test:create-reports', 'run-s cleanup:all test:cy merge_reports generate_html_report create-tree');
addProjectProperty(projectSettings, 'scripts', 'create-tree', 'node ' + outputDir + 'integration/cy-report-tree-generator.js --path=' + outputDir);

/** set up devDependancies */
addProjectProperty(projectSettings, 'devDependencies', 'cypress', '^4.0.1');
addProjectProperty(projectSettings, 'devDependencies', 'mocha', '^5.2.0');
addProjectProperty(projectSettings, 'devDependencies', 'mochawesome', '^4.1.0');
addProjectProperty(projectSettings, 'devDependencies', 'mochawesome-merge', '^2.0.1');
addProjectProperty(projectSettings, 'devDependencies', 'mochawesome-report-generator', '^4.1.0');
addProjectProperty(projectSettings, 'devDependencies', 'npm-run-all', '^4.1.5');
addProjectProperty(projectSettings, 'devDependencies', 'directory-tree', '^2.2.4');
addProjectProperty(projectSettings, 'devDependencies', 'yargs', '^15.1.0');
addProjectProperty(projectSettings, 'devDependencies', 'json-beautify', '^1.1.1');

/** add cypress settings */
addProjectProperty(cypressSettings, 'reporterOptions', 'reportDir', outputDir + 'integration/reports/mocha');
addProjectProperty(cypressSettings, 'reporterOptions', 'quiet', true);
addProjectProperty(cypressSettings, 'reporterOptions', 'html', false);
addProjectProperty(cypressSettings, 'reporterOptions', 'overwrite', false);
addProjectProperty(cypressSettings, 'reporterOptions', 'json', true);
cypressSettings['videosFolder'] = outputDir + 'integration/public/videos';
cypressSettings['screenshotsFolder'] = outputDir + 'integration/public/screenshots';
cypressSettings['videoCompression'] = false;
cypressSettings['reporter'] = 'mochawesome';
cypressSettings['browser'] = 'electron';
cypressSettings['chromeWebSecurity'] = false;

/** directory folder structures */
const integrationFolder = outputDir + 'integration/';
const publicDirectoryPath = outputDir + `integration/public/`;
const nginxPath = outputDir + `integration/nginx/`;
const nginxConfPath = outputDir + `integration/nginx/conf/`;
const nginxIncludesPath = outputDir + `integration/nginx/conf/includes/`;
const videosPath = outputDir + `integration/public/videos`;
const screenshotsPath = outputDir + `integration/public/screenshots`;
const paths = [outputDir, integrationFolder, publicDirectoryPath, nginxPath, nginxConfPath, nginxIncludesPath, videosPath, screenshotsPath];

/** static file data for cloud foundry setup */
const staticFileData = `root: public
location_include: includes/*.conf
`;
const headersConfData = 'add_header "Access-Control-Allow-Origin" "*";';
const manifestHeader = `---
applications:`;
let manifestAppInfo = `
- name: ${APP_NAME}-cy-reports
  random-route: false
  memory: 1G
  instances: 1
  path: ./${outputDir}integration
`;

/** function for creating directory folders */
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

/** function for storying files */
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

/** function to store cloud foundry manifest file */
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
                if(!currentManifest.includes(`${APP_NAME}-cy-reports`)) {
                    manifestAppInfo = `${currentManifest}
                    ${manifestAppInfo}`;
                    fs.writeFileSync(`manifest.yml`, manifestAppInfo);
                } else {
                    console.log(`manifest.yml already exists and includes ${APP_NAME}-cy-reports...`);
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
storeData(beautify(projectSettings, null, 2, 100), 'package.json', '');
storeData(beautify(cypressSettings, null, 2, 100), 'cypress.json', '');
storeData(CY_REPORT_TREE_GENERATOR, 'cy-report-tree-generator.js', integrationFolder);

/** checking cloud flag  running cloud set up for files if needed */
if (isCloudFoundry) {
    console.log('Using Cloud Foundry...');
    console.log('setting up cloud files...');
    storeData(staticFileData, 'Staticfile', integrationFolder);
    storeData(headersConfData, 'headers.conf', nginxIncludesPath);
    storeManifest(manifestAppInfo);
}

console.log('Project Setup complete! please run npm install now to install the added mochawesome report dependencies.')



