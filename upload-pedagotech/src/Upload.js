import React, { useState, useReducer } from "react";
import Axios from 'axios';
import { reducer, initialState } from './appReducer';
import { getToken } from './appMiddleware';
import { styleDatas } from './styleDatas';
import { levelDatas } from './levelDatas';
import { typeDatas } from './typeDatas';

import './upload.scss';
import sheetColor from './assets/sheetColor.png';


const Upload = () => {
    const [state, dispatch] = useReducer(reducer, initialState);
    const [arrayTracks, setarrayTracks] = useState([]);
    const [arrayMedias, setarrayMedias] = useState([]);


    const handleFileMysql = () => {
        Axios({
            method: "GET",
            url: "http://localhost:5000/mysqlReadTitleTable",
            headers: {
                "Content-Type": "application/json"
            }
        }).then(res => {
            console.log(res.data.message);

            setarrayTracks(res.data.data);
            console.log("mon tableau mysql", res.data.data);

        }).catch(error => {
            console.log('error reception mysql', error);
        });
    }




    //First call spotify api (tracks)
    const getApiData = async (token, id) => {
        const res = await Axios.get(`https://api.spotify.com/v1/tracks/${id}`, {

            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        })

        // spotify informations
        const title = res.data.name;
        const artistName = res.data.artists[0].name;
        const artistId = res.data.artists[0].id;
        const spotifyCoverLink = res.data.album.images[0].url;
        const year = res.data.album.release_date.slice(0, 4);
        const spotifyLink = res.data.external_urls.spotify;
        const spotifyTrackId = res.data.id;

        //call second api call 
        secondCall(title, artistName, artistId, spotifyCoverLink, year, spotifyLink, spotifyTrackId, token);
        return res;
    }

    // first callback
    const firtCall = () => {
        console.log("mon tableau est", arrayTracks);
        const arrayIdSpotify = arrayTracks.map(item => Object.values(item[10]).join(''));
        console.log('mon id spotify est', arrayIdSpotify);

        arrayIdSpotify.forEach((id) => {
            const FetchData = async () => {
                const token = await getToken();
                const data = await getApiData(token, id);
                dispatch({
                    type: 'FETCH_DATA',
                    payload: data,
                })
            }
            setTimeout(() => {
                FetchData();
            }, 2000);
            console.log('premiere requete api');
        });

    }

    //2nde call of spotify api
    const getApiArtist = async (token, artistId) => {
        const resArtist = await Axios.get(` https://api.spotify.com/v1/artists/${artistId}`, {

            headers: {
                Authorization: `Bearer ${token}`,
            },
        })

        return resArtist.data.genres;
    }


    //second call spotify api artist (to get the style)     

    const secondCall = (title, artistName, artistId, spotifyCoverLink, year, spotifyLink, spotifyTrackId, token) => {
        const FetchDataArtist = async () => {
            const genreArtist = await getApiArtist(token, artistId);
            const style = styleFilter(genreArtist);

            const arraySpotifyInfos = [
                { title },
                { artistName },
                { artistId },
                { year },
                { style },
                { spotifyLink },
                { spotifyCoverLink },
                { spotifyTrackId },
            ];

            setTimeout(() => {
                uploadGoogleSheet(arraySpotifyInfos);
            }, 1000);

        }

        setTimeout(() => {
            console.log('execution fetchdataArtist');
            FetchDataArtist();
        }, 2000);


    }


    //function to get the  personal style of a tracks
    const styleFilter = (genreArtist) => {
        const styleDatasArray = styleDatas.map(styleData => styleData.value);
        let styles = [];
        const styleSpotify = genreArtist;
        styleSpotify.map(style => {
            if (styleDatasArray.includes(style)) {
                styles = [...styles, style];
            }
            return null;
        });

        return styles.length > 0 ? styles[0] : "Autres";

    }

    const uploadGoogleSheet = (arraySpotifyInfos) => {
        let dataFinal = [];
        const newArray = arrayTracks.splice(0, 1);
        newArray[0].splice(1, 3);
        const idExtra = newArray.map(newArray => newArray[0]);
        arraySpotifyInfos.splice(2, 1);
        const finalArray = arraySpotifyInfos.map(item => Object.values(item).join(''));
        dataFinal.push(finalArray);
        const lastDataFinal = finalArray.concat(idExtra);
        let arrayGoogle = [];
        arrayGoogle.push(lastDataFinal);
        setTimeout(() => {
            console.log("mon tableau a envoyé dans googlesheet", arrayGoogle);
            handleSubmitGoogleSheet(arrayGoogle);
        }, 10000);

    }

    const handleSubmitGoogleSheet = (arrayGoogle) => {
        Axios.post('http://localhost:5000/', {
            data: arrayGoogle
        })
            .then(function (response) {
                console.log('yes le serveur receptionne', response);
            })
            .catch(function () {
                console.log('et nope');
            });
    }

    const handleFileTitle = () => {
        handleFileMysql();
        firtCall();
    }

    //---------------------------------------------------------MEDIA PART-----------------------------------------------------
    const handleFileMysqlMedia = () => {
        Axios({
            method: "GET",
            url: "http://localhost:5000/mysqlReadMediaTable",
            headers: {
                "Content-Type": "application/json"
            }
        }).then(res => {
            console.log("mon tableau mysql media est", res.data.data);
            setarrayMedias(res.data.data);

        }).catch(error => {
            console.log('error reception mysql', error);
        });
    }
    const handleFileMedia = () => {
        uploadInformationsMedia();
    }

    const uploadInformationsMedia = () => {
        levelDatasExtranet();
        //@TODO à faire
        //professorDatasExtranet();
    }
    const levelDatasExtranet = () => {
        let levelIdPedagotech = "";
        const arrayLevelExtranetId = arrayMedias.map(item => item[3]);
        const arrayLevelPedagotech = levelDatas.map(level => level.value);

        arrayLevelExtranetId.map((levelid => {
            if (levelid >= -1 && levelid <= 0) {
                levelid = arrayLevelPedagotech[0];
                levelIdPedagotech = levelid
            } else if (levelid >= 1 && levelid <= 4) {
                levelid = arrayLevelPedagotech[1];
                levelIdPedagotech = levelid;
            } else if (levelid >= 6 && levelid <= 8) {
                levelid = arrayLevelPedagotech[2];
                levelIdPedagotech = levelid;
            } else if (levelid >= 12 && levelid <= 14) {
                levelid = arrayLevelPedagotech[3];
                levelIdPedagotech = levelid;
            } else if (levelid >= 15 && levelid <= 17) {
                ;
                levelid = arrayLevelPedagotech[4];
                levelIdPedagotech = levelid;
            }
            return levelIdPedagotech;
        }));

        typeDatasExtranet(levelIdPedagotech);
    }

    const typeDatasExtranet = (levelIdPedagotech) => {
        let arrayInfos = [];
        let typeIdPedagotech = "";
        const arrayTypeExtranetId = arrayMedias.map(item => item[5]);
        const arrayTypePedagotech = typeDatas.map(type => type.value);

        arrayTypeExtranetId.map((typeid => {
            if (typeid >= -1 && typeid <= 0) {
                typeid = arrayTypePedagotech[0];
                typeIdPedagotech = typeid;
            } else if (typeid === 1) {
                typeid = arrayTypePedagotech[1];
                typeIdPedagotech = typeid;
            } else if (typeid === 2) {
                typeid = arrayTypePedagotech[2];
                typeIdPedagotech = typeid;
            } else if (typeid === 3) {
                typeid = arrayTypePedagotech[3];
                typeIdPedagotech = typeid;
            } else if (typeid === 4) {
                typeid = arrayTypePedagotech[4];
                typeIdPedagotech = typeid;
            } else if (typeid === 5) {
                typeid = arrayTypePedagotech[5];
                typeIdPedagotech = typeid;
            } else if (typeid === 6) {
                typeid = arrayTypePedagotech[6];
                typeIdPedagotech = typeid;
            } else if (typeid === 7) {
                typeid = arrayTypePedagotech[7];
                typeIdPedagotech = typeid;
            } else if (typeid === 8) {
                typeid = arrayTypePedagotech[8];
                typeIdPedagotech = typeid;
            } else if (typeid === 9) {
                typeid = arrayTypePedagotech[9];
                typeIdPedagotech = typeid;
            } else if (typeid === 10) {
                typeid = arrayTypePedagotech[10];
                typeIdPedagotech = typeid;
            } else if (typeid === 11) {
                typeid = arrayTypePedagotech[11];
                typeIdPedagotech = typeid;
            } else if (typeid === 12) {
                typeid = arrayTypePedagotech[12];
                typeIdPedagotech = typeid;
            } else if (typeid === 13) {
                typeid = arrayTypePedagotech[13];
                typeIdPedagotech = typeid;
            }

            const arrayInfosPedagotech = [
                typeIdPedagotech,
                levelIdPedagotech
            ]
            arrayInfos.push(arrayInfosPedagotech);

           
            return arrayInfos;
            
        }));
        uploadGoogleSheetMedia(arrayInfos,levelIdPedagotech);
    }


    const uploadGoogleSheetMedia = (arrayInfos) => {
        let arrayLastFinal = [];
        let arrayMediaFinal = [];
        arrayMediaFinal.push(arrayMedias);
        let arrayInfosFinal = [];
        arrayInfosFinal.push(arrayInfos);
        arrayMediaFinal[0].map(media => Object.values(media));
        arrayInfosFinal[0].map(info => Object.values(info));
        // count the lenght of the array
        const numbArray = arrayMediaFinal[0].length - 1;
        console.log(numbArray);
       
        for(var i = 0; i <= numbArray; i++) {
                arrayMediaFinal[0][i].splice(5,1);
                arrayMediaFinal[0][i].splice(3, 1);
                //@TODO professeurid :
                //arrayMediaFinal[0][i].splice(6, 1);
                const finalArray = arrayMediaFinal[0][i].concat(arrayInfosFinal[0][i]);
                arrayLastFinal.push(finalArray);
        }
            console.log(arrayLastFinal);
            setTimeout(() => {
                console.log("mon tableau a envoyé dans googlesheet", arrayLastFinal);
                handleSubmitGoogleSheetMedia(arrayLastFinal);
            }, 6000);
}

const handleSubmitGoogleSheetMedia = (arrayLastFinal) => {
    Axios.post('http://localhost:5000/media', {
        data: arrayLastFinal
    })
        .then(function (response) {
            console.log('yes le serveur receptionne les medias', response);
        })
        .catch(function () {
            console.log('et nope');
        });
}

    return (
        <div id="upload">
            <div id="upload-container">
                <div id="upload-containerTitle">
                    <button id="upload-button" onClick={handleFileTitle}>Mettre à jour les titres</button>
                </div>
                <div id="upload-containerMedia">
                    <button id="upload-button" onClick={handleFileMysqlMedia}>Appel MYSQL</button>
                    <button id="upload-button" onClick={handleFileMedia}>Mettre à jour les médias</button>
                </div>
            </div>


            <div id="upload-containerDoc">
                <div id="upload-containerGoogleSheetTitle">
                    <h3 id="upload-subtitle">Votre document GoogleSheet a été mis à jour !</h3>
                    <a href="https://docs.google.com/spreadsheets/d/1fDDccNM-8kFfWvUmKcViJEkOfyq3uqPGOlTq2azVclY" target="_blank" rel="noopener noreferrer">
                        <img
                            alt="logo"
                            id="upload-img"
                            src={sheetColor}
                        />
                    </a>
                </div>
                <div id="upload-containerGoogleSheetMedia">
                    <h3 id="upload-subtitle">Votre document GoogleSheet a été mis à jour !</h3>
                    <a href="https://docs.google.com/spreadsheets/d/1Taa0FiDmjkYRzGLT7FndJ8tBgL7KsxK3ZD6Hv56XxPA" target="_blank" rel="noopener noreferrer">
                        <img
                            alt="logo"
                            id="upload-img"
                            src={sheetColor}
                        />
                    </a>
                </div>
            </div>
        </div>
    );
}

export default Upload;
