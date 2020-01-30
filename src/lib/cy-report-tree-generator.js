const dirTree = require('directory-tree');
const fs = require('fs');
const beautify = require('json-beautify');
const argv = require('yargs')
    .command('*', 'default runner', (yargs) => {}, (argv) => {
    }).argv;
const path = argv.path+'integration/public';
console.log('** Path : %s ***', path);

const tree = dirTree(path);
console.log('- Directory Tree Found..');
console.dir(tree, {depth: 20});
const data = beautify(tree, null, 2, 100);

/** function to create file/store the data */
const storeData = (data, path) => {
    try {
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path);
        }
    } catch (err) {
        console.error(err);
    }
    try {
        fs.writeFileSync(`${path}/report-tree-listing.json`, data);
        console.log('** Tree Data Stored.. **');
    } catch (err) {
        console.error(err);
    }
};

console.log('**** Attempting to find and store report tree data.. ****');
storeData(data, path);