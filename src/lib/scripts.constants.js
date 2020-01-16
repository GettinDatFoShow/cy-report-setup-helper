export const scripts = [
    ['cleanup:all', 'run-p cleanup:reports cleanup:evidence'],
    ['cleanup:reports','rm -fr integration/public/report* && rm -fr integration/report*'],
    ['cleanup:evidence','rm -fr integration/public/videos* && rm -fr integration/public/screenshots*'],
    ['merge_reports','mochawesome-merge --reportDir=integration/reports/mocha > integration/public/report.json'],
    ['generate_html_report','marge integration/public/report.json -f report -o integration/public/'],
    ['test:cy','run-p --race --silent start cy:run'],
    ['cy:run','cypress run'],
    ['test:create-reports','run-s cleanup:all test:cy merge_reports generate_html_report create-tree']
    ['create-tree','node integration/d-tree-listing.js']
];