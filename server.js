// include used libraries
var http = require('http');
var mysql = require('mysql');
var fs = require("fs");

// mysql connection
var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "hacktheplanet"
});
con.connect();

// function to load css and js files requested by the client
const serveCSS = function (req, res) {
    if (req.url.indexOf('css') !== -1) {
        const css = fs.createReadStream(__dirname + req.url, 'utf8');
        css.pipe(res);
    }

    if (req.url.indexOf('js') !== -1) {
        const js = fs.createReadStream(__dirname + req.url, 'utf8');
        js.pipe(res);
    }
};

var server = http.createServer(function (req, res) {
    serveCSS(req, res);

    // serve requests for index.html 
    if (req.url == '/index.html') {

        fs.readFile('index.html', function (err, page) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            if (err) console.log(err);

            // query all the data to display from the database
            var sql = "SELECT (SELECT name FROM equipment WHERE id = r1.fromEquipment) AS name1, r1.fromEquipment AS id1, (SELECT name FROM equipment WHERE id = r1.toEquipment) AS name2, r1.toEquipment AS id2, (SELECT name FROM equipment WHERE id = r2.toEquipment) AS name3, r2.toEquipment AS id3, (SELECT name FROM equipment WHERE id = r3.toEquipment) AS name4, r3.toEquipment AS id4 FROM relationships AS r1 LEFT JOIN relationships AS r2 ON r2.fromEquipment = r1.toEquipment LEFT JOIN relationships AS r3 ON r3.fromEquipment = r2.toEquipment WHERE r1.fromEquipment IN (SELECT id FROM equipment WHERE equipmentType = 1) ORDER BY r1.fromEquipment, r1.toEquipment, r2.toEquipment, r3.toEquipment ASC;"
            con.query(sql, function (err, result) {
                if (err) console.log(err);

                //this will be the html to load in the view
                var strHtml = "<div class='row'><div class='col-sm-6'>";
                //keep track of the last coomponent seen on each level
                var level1name = "";
                var level2name = "";
                var level3name = "";
                var level4name = "";
                // iterate the query results
                Object.keys(result).forEach(function (key) {
                    var row = result[key];

                    // encountered a level one component, decide whether to display it
                    if (row.name1 != null && row.name1 != level1name) {
                        strHtml += generateHTMLComponent(row.name1, 'pc', row.id1, 0);
                        level1name = row.name1;
                        level2name = "";
                        level3name = "";
                        level4name = "";
                    }

                    // encountered a level two component, decide whether to display it
                    if (row.name2 != null && row.name2 != level2name) {
                        strHtml += generateHTMLComponent(row.name2, 'col-sm-offset-1 component', row.id2, row.id1);
                        level2name = row.name2;
                        level3name = "";
                        level4name = "";
                    }

                    // encountered a level three component, decide whether to display it
                    if (row.name3 != null && row.name3 != level3name) {
                        strHtml += generateHTMLComponent(row.name3, 'col-sm-offset-2 component2', row.id3, row.id1 + "-" + row.id2);
                        level3name = row.name3;
                        level4name = "";
                    }

                    // encountered a level four component, decide whether to display it
                    if (row.name4 != null && row.name4 != level4name) {
                        strHtml += generateHTMLComponent(row.name4, 'col-sm-offset-3 component3', row.id4, row.id1 + "-" + row.id2 + "-" + row.id3);
                        level4name = row.name4;
                    }

                });
                strHtml += "</div></div>";

                //render the view with the generated html
                res.write(String(page).replace("{{content}}", strHtml));
                res.end();
            });
        });

    }

    // serve request for file export
    if (req.url.includes('/fileexport')) {
        var urlParams = req.url.split('=');
        if (urlParams.length < 2) {
            res.write('Error: invalid URL!');
            res.end();
        }
        var currentID = urlParams[1];

        // query all data need for csv file
        var sql = "SELECT (CASE WHEN EXISTS (SELECT * FROM relationships WHERE fromEquipment = " + currentID + ") THEN NULL ELSE name END) AS name1, NULL AS name2, NULL as name3, NULL as name4 FROM equipment WHERE id = " + currentID + " UNION ALL SELECT (SELECT name FROM equipment WHERE id = r1.fromEquipment) AS name1, (SELECT name FROM equipment WHERE id = r1.toEquipment) AS name2, (SELECT name FROM equipment WHERE id = r2.toEquipment) AS name3, (SELECT name FROM equipment WHERE id = r3.toEquipment) AS name4 FROM relationships AS r1 LEFT JOIN relationships AS r2 ON r2.fromEquipment = r1.toEquipment LEFT JOIN relationships AS r3 ON r3.fromEquipment = r2.toEquipment WHERE r1.fromEquipment  = " + currentID + ";"
        con.query(sql, function (err, result) {
            if (err) console.log(err);

            var csvData = "";
            // iterate the query results
            Object.keys(result).forEach(function (key) {
                var row = result[key];
                if (row.name1 != null)
                    csvData += row.name1 + ",";
                if (row.name2 != null)
                    csvData += row.name2 + ",";
                if (row.name3 != null)
                    csvData += row.name3 + ",";
                if (row.name4 != null)
                    csvData += row.name4;

                if (row.name1 != null || row.name2 != null || row.name3 != null || row.name4 != null)
                    csvData += "\n";
            });

            // generate csv file and render data in it
            fs.writeFile('data.csv', csvData, 'utf8', function (err) {
                res.writeHead(200, {
                    "Content-Type": "application/octet-stream",
                    "Content-Disposition": "attachment; filename=data.csv"
                });

                fs.createReadStream("data.csv").pipe(res);
            });
        });
    }
});
server.listen(8080);

// generate an html component with the given parameters
function generateHTMLComponent(name, classes, id, parent_id) {
    // check if this is the top level parent or not
    var plus_id = (parent_id == 0) ? "" + id : "" + parent_id + "-" + id;
    return "<div class='component-container " + classes + "'  data-id='" + id + "' data-parent-id='" + parent_id + "'>" + name + "<span class='link-export'><a href='http://localhost:8080/fileexport?id=" + id + "' class='export-link' data-id='" + id + "'>export</a></span><span data-id='" + plus_id + "' class='plus'>+</span></div>";
}
