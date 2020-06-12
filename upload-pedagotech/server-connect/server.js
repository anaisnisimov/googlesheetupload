"use strict"

const express = require("express"),
    app = express(),
    port = process.env.PORT || 5000,
    cors = require("cors");
const axios = require("axios");
const queryString = require('query-string');
require('dotenv').config()
var mysql = require('mysql');
app.use(cors());
app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
app.listen(port, () => console.log("Backend server live on " + port));



//Google API

const Bearer = require('@bearer/node')('FUFbE-aEBIbyWN5aVuX3wpWVp5pMOL8C')
const gsheet = Bearer.integration('google_sheets')


app.post('/', (req, res) => {
    // récupère la reponse coté front 
    console.log('demande reçu !', req.body.data)

    // 3. Define spreadsheet and values to append
    const spreadsheetId = '1fDDccNM-8kFfWvUmKcViJEkOfyq3uqPGOlTq2azVclY'
    const data = req.body.data

    // 4. Send data with a POST request
    gsheet.auth('ae8c3120-9510-11ea-b789-e3992aebbe8b')
        .post(`${spreadsheetId}/values/A2:append`, {
            body: { values: data },
            query: { valueInputOption: 'RAW' }
        }).then(() => {
            // setTimeout(() => {
            console.log('mon tableau coté serveur est', data);
            const responseObj = {
                statutCode: 200,
                body: req.body.data,
                message: "ok c'est transmis"
            }
            res.send(responseObj);
            console.log('Saved!')
            // }, 1300);
        }).catch((error) => {
            console.log('NOOON', error);
        })

})
//GOOGLE API MEDIA 

app.post('/media', (req, res) => {
    // récupère la reponse coté front 
    console.log('demande reçu !', req.body.data)

    // 3. Define spreadsheet and values to append
    const spreadsheetId = '1Taa0FiDmjkYRzGLT7FndJ8tBgL7KsxK3ZD6Hv56XxPA'
    const data = req.body.data

    // 4. Send data with a POST request
    gsheet.auth('ae8c3120-9510-11ea-b789-e3992aebbe8b')
        .post(`${spreadsheetId}/values/A2:append`, {
            body: { values: data },
            query: { valueInputOption: 'RAW' }
        }).then(() => {
            // setTimeout(() => {
            console.log('mon tableau coté serveur est', data);
            const responseObj = {
                statutCode: 200,
                body: req.body.data,
                message: "ok c'est transmis"
            }
            res.send(responseObj);
            console.log('Saved!')
            // }, 1300);
        }).catch((error) => {
            console.log('NOOON', error);
        })

})

// SPOTIFY API
app.get("/", (req, res) => {
    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + new Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64')
    };
    axios.post('https://accounts.spotify.com/api/token?grant_type=client_credentials', queryString.stringify({}), {
        headers
    })
        .then(apiResponse => {
            const responseObject = {
                statusCode: 200,
                body: (apiResponse.data.access_token),
                message: "we dit it "
            };
            res.send(responseObject);
        })
        .catch(err => {
            console.error("Error: " + err);
        });
});



// mysql Title

app.get("/mysqlReadTitleTable", (req, res) => {
    //mysql connection 
    console.log('connection à la route mysql');
   

    console.log('Get connection ...');

    var mySqlClient = mysql.createConnection({
        database: 'testextranet',
        host: "localhost",
        user: "root",
        password: "XXXXXX"
    });

    mySqlClient.connect(function (err) {
        if (err) throw err;
        console.log("Connected!");
    });
    // query to read title table in bdd 
    const getDomain = async () => {
        const result = await dbQuery('SELECT * FROM MediaPedagogique WHERE idspotify IS NOT NULL');
        return result;
    }

    // * Important promise function
    function dbQuery(databaseQuery) {
        return new Promise(data => {
            mySqlClient.query(databaseQuery, function (error, result) {
                if (error) {
                    console.log(error);
                    mySqlClient.end();
                    return;
                }
                try {
                    if (result.length > 0) {
                        // function  will be used on every row returned by the query
                        const objectifyRawPacket = row => ({ ...row });
                        // iterate over all items and convert the raw packet row -> js object
                        const arrayExtranet = result.map(objectifyRawPacket => Object.values(objectifyRawPacket));
                        console.log(arrayExtranet);
                        data(arrayExtranet);
                        // res.send('tableau extranet enregistré', arrayExtranet);
                        res.send({
                            message: 'tableau extranet enregistré',
                            data: arrayExtranet
                        });
                    }
                } catch (error) {
                    data({});
                    throw error;
                }
                mySqlClient.end();
            });
        });

    }
    getDomain();
});

//mysql media
app.get("/mysqlReadMediaTable", (req, res) => {
    //mysql connection 
    console.log('connection à la route mysql');

    console.log('Get connection ...');

    var mySqlClient = mysql.createConnection({
        database: 'testextranet',
        host: "localhost",
        user: "root",
        password: "XXXXXX"
    });

    mySqlClient.connect(function (err) {
        if (err) throw err;
        console.log("Connected!");
    });
    // query to read title table in bdd 
    const getDomain = async () => {
        const result = await dbQuery(
            'SELECT FichierPedagogique.id,nomfichier,nom, niveau_id,Activite.nomActivite,typeFichier_id,professeur_id,mediaPedagogique_id, MediaPedagogique.idspotify FROM FichierPedagogique LEFT JOIN MediaPedagogique ON mediaPedagogique_id = MediaPedagogique.id LEFT JOIN fichierpedagogique_activite ON  FichierPedagogique.id = fichierpedagogique_id LEFT JOIN Activite ON fichierpedagogique_activite.activite_id = Activite.id WHERE mediaPedagogique_id is not NULL AND idspotify is not NULL AND niveau_id is not NULL');
        return result;
    }

    // * Important promise function
    function dbQuery(databaseQuery) {
        return new Promise(data => {
            mySqlClient.query(databaseQuery, function (error, result) {
                if (error) {
                    console.log(error);
                    mySqlClient.end();
                    return;
                }
                try {
                    if (result.length > 0) {
                        // function  will be used on every row returned by the query
                        const objectifyRawPacket = row => ({ ...row });
                        // iterate over all items and convert the raw packet row -> js object
                        const arrayExtranetMedia = result.map(objectifyRawPacket => Object.values(objectifyRawPacket));
                        console.log(result);
                        data(arrayExtranetMedia);
                        res.send({
                            message: 'tableau media enregistré',
                            data: arrayExtranetMedia
                        });
                    }
                } catch (error) {
                    data({});
                    throw error;
                }
                mySqlClient.end();
            });
        });

    }
    getDomain();
});