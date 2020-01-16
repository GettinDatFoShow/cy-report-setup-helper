const dirTree = require('directory-tree');
const fs = require('fs');
const path = 'integration/public';
console.log('** Path : %s ***', path);

const tree = dirTree(path);
console.log('- Directory Tree Found..');
console.dir(tree, {depth: 20});
const data = JSON.stringify(tree);

/** function to create file/store the data */
const storeData = (data, path) => {
    try {
        if (!fs.existsSync(paht)) {
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