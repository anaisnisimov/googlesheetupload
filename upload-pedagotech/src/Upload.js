import React, { useState, useReducer } from "react";
import Axios from 'axios';
import { reducer, initialState } from './appReducer';
import { getToken } from './appMiddleware';
import { styleDatas } from './styleDatas';
import { levelDatas } from './levelDatas';
import {Loader} from 'semantic-ui-react';
import { typeDatas } from './typeDatas';
import './upload.scss';
import sheetColor from './assets/sheetColor.png';

const Upload = () => {
    const [state, dispatch] = useReducer(reducer, initialState);
    const [arrayTitle,setarrayTitle] = useState([]);
    const [uploadDoc,setuploadDoc] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searchId, setSearchId] = useState('');
    let arrayMysql = [];
    let arrayIdSpotify = [];
    let arrayMysqlMedia = [];
    let arrayGoogle = [];
    let arrayMediaComplete = [];
    let arrayLastFinal = [];
    let arrayMediaFinal = [];
    let arrayInfosFinal = [];

    const handleChange = (e) => {
        setSearchId(e.target.value);

    };
    
    const handleFileMysql = () => {
        Axios({
            method: "POST",
            url: "http://localhost:5000/mysqlReadTitleTable",
            headers: {
                "Content-Type": "application/json"
            },
             data: { searchId }
        }).then(res => {
            console.log("oui le serveur recupere l'id");
            console.log(res.data.message);
            console.log("mon tableau mysql", res.data.data);
            arrayMysql = res.data.data;
            console.log(arrayMysql);
            firtCall(arrayMysql);
          
        }).catch(error => {
            console.log('error reception mysql', error);
        });
    }


    //First call spotify api (tracks)
    const getApiData = async (token, id, arrayMysql) => {
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
        secondCall(title, artistName, artistId, spotifyCoverLink, year, spotifyLink, spotifyTrackId, token, arrayMysql);
        return res;
    }

    // first callback
    const firtCall = (arrayMysql) => {
        // recupération de l'idspotify via l'url spotify
        console.log(arrayMysql);
        const arrayLinkIdSpotify = arrayMysql.map(item => Object.values(item[10]).join('').split("track"));
        const numbArrayLinkIdSpotify = arrayLinkIdSpotify.length - 1;
        for (var i = 0; i <= numbArrayLinkIdSpotify; i++) {
            arrayLinkIdSpotify[i].splice(0, 1);
            console.log(arrayLinkIdSpotify);
        }
        arrayIdSpotify.push(arrayLinkIdSpotify);
        console.log(arrayIdSpotify);
        const idSpotify = arrayIdSpotify[0].map(id =>
            Object.values(id[0]).join("")
        );
        console.log(idSpotify);
        const idSpotifyFinal = idSpotify.map(idSpot => idSpot.slice(1, 23));
        console.log(idSpotifyFinal);

        idSpotifyFinal.forEach((id) => {
            const FetchData = async () => {
                const token = await getToken();
                const data = await getApiData(token, id, arrayMysql);
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
    const secondCall = (title, artistName, artistId, spotifyCoverLink, year, spotifyLink, spotifyTrackId, token, arrayMysql) => {
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
            uploadGoogleSheet(arraySpotifyInfos, arrayMysql);

        }
        setTimeout(() => {
            console.log('execution fetchdataArtist');
            FetchDataArtist();
        }, 4000);


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

    const uploadGoogleSheet = (arraySpotifyInfos, arrayMysql) => {
        let dataFinal = [];
        const newArray = arrayMysql.splice(0, 1);
        newArray[0].splice(1, 3);
        const idExtra = newArray.map(newArray => newArray[0]);
        arraySpotifyInfos.splice(2, 1);
        const finalArray = arraySpotifyInfos.map(item => Object.values(item).join(''));
        dataFinal.push(finalArray);
        const lastDataFinal = finalArray.concat(idExtra);
        arrayGoogle.push(lastDataFinal);
        handleGoogleSheetTitle(arrayGoogle);
    }
   
    const handleGoogleSheetTitle = (arrayGoogle) => {
        let newArrayTitle = [];
        newArrayTitle.push(arrayGoogle);
        const newArrayPop = newArrayTitle.pop(newArrayTitle);
        arrayTitle.push(newArrayPop);
        setarrayTitle(arrayTitle);
        console.log(arrayTitle);
    }

    const handleSubmitGoogleSheetTitle = () => {
        const arrayTitleFinal = arrayTitle[0].map(title =>title);
        setarrayTitle(arrayTitleFinal);
        console.log("mon tableau à mettre à jour dans googlesheet", arrayTitleFinal);
       
        Axios.post('http://localhost:5000/', {
            data: arrayTitleFinal
        })
            .then(function (response) {
                console.log('yes le serveur receptionne', response);
                handleFileMysqlMedia();
            })
            .catch(function () {
                console.log('et nope');
            });
    }

    const handleUploadTitleAndMedia= (e) => {
        e.preventDefault();
        setLoading(true);
        handleFileMysql(e);
        setTimeout(() => {
            handleSubmitGoogleSheetTitle();
        }, 
        10000);
    }
    //---------------------------------------------------------MEDIA PART-----------------------------------------------------
    const handleFileMysqlMedia = () => {
        Axios({
            method: "POST",
            url: "http://localhost:5000/mysqlReadMediaTable",
            headers: {
                "Content-Type": "application/json"
            },
            data:{searchId}
        }).then(res => {
            console.log("mon tableau mysql media est", res.data.data);
            arrayMysqlMedia = res.data.data;
            getInformationsMedia(arrayMysqlMedia);

        }).catch(error => {
            console.log('error reception mysql', error);
        });
    }
    const getInformationsMedia = (arrayMysqlMedia) => {
        levelDatasExtranet(arrayMysqlMedia);
        //@TODO à faire
        //professorDatasExtranet();
    }
    const levelDatasExtranet = (arrayMysqlMedia) => {

        let levelIdPedagotech = "";
        const arrayLevelExtranetId = arrayMysqlMedia.map(item => item[3]);
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
                levelid = arrayLevelPedagotech[4];
                levelIdPedagotech = levelid;
            }
            return levelIdPedagotech;
        }));

        typeDatasExtranet(levelIdPedagotech, arrayMysqlMedia);
    }

    const typeDatasExtranet = (levelIdPedagotech, arrayMysqlMedia) => {
        let arrayInfos = [];
        let typeIdPedagotech = "";
        const arrayTypeExtranetId = arrayMysqlMedia.map(item => item[5]);
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

        arrayMediaFinal.push(arrayMysqlMedia);
        uploadAllInfosMedia(arrayInfos, arrayMysqlMedia);
    }
    const uploadAllInfosMedia = (arrayInfos, arrayMediaFinal) => {
       
        console.log("test",arrayMediaFinal);
        arrayInfosFinal.push(arrayInfos);
        arrayMediaFinal.map(media => Object.values(media));
        arrayInfosFinal[0].map(info => Object.values(info));
            // count the lenght of the array
            const numbArray = arrayMediaFinal.length - 1;
       
            for(var i = 0; i <= numbArray; i++) {
                    arrayMediaFinal[i].splice(5,1);
                    arrayMediaFinal[i].splice(3, 1);
                    //@TODO professeurid :
                    //arrayMediaFinal[0][i].splice(6, 1);
                    const finalArray = arrayMediaFinal[i].concat(arrayInfosFinal[0][i]);
                    arrayLastFinal.push(finalArray);
            }
        console.log("mon tableau après traitement",arrayLastFinal);
        getmediaDataComplete(arrayLastFinal);
    }
    const getmediaDataComplete = (arrayLastFinal) => {

        const uploadInfosSpotifyToMedias = (id, arr) => {
            arrayTitle[0].map(elem => {
                if (elem[7] === id) {
                    arrayMediaComplete.push(arr.concat(elem));;
                }
            });
        }
        arrayLastFinal.map(arr => {
            uploadInfosSpotifyToMedias(arr[5], arr);
        });
        setTimeout(() => {
            const numbArrayMedia = arrayMediaComplete.length - 1;
            console.log(numbArrayMedia);
            for (var i = 0; i <= numbArrayMedia; i++) {
                if(arrayMediaComplete[i][3] === null){
                    arrayMediaComplete[i][3] = "Aucune";
                };
            //  arrayMediaComplete[i].splice(5, 1);
                arrayMediaComplete[i].splice(6, 1);
            // arrayMediaComplete[0][i].splice(15, 1);
                // console.log(arrayMediaComplete);
            }
           
            console.log("mon tableau a envoyé dans googlesheet", arrayMediaComplete);
            handleSubmitGoogleSheetMedia(arrayMediaComplete);
        }, 2000);
    }
    const handleSubmitGoogleSheetMedia = (arrayMediaComplete) => {
    Axios.post('http://localhost:5000/media', {
        data: arrayMediaComplete
    })
        .then(function (response) {
            console.log('yes le serveur receptionne les medias', response);
            setLoading(false);
            setuploadDoc(true);
        })
        .catch(function () {
            console.log('et nope');
        });
}

  
    return (
        <div id="upload">
            <div id="upload-container">
                <div id="upload-containerIDButton">
                    <div id="upload-boxId">
                        <form>
                            <label id="search-label" >
                                <input
                                    type="text"
                                    id="upload-inputId"
                                    placeholder="Id extranet à renseigner..."
                                    onChange={handleChange}
                                />
                            </label>
                            <div id="upload-containerTitle">
                                <button id="upload-button" type="submit" onClick={handleUploadTitleAndMedia}>Mettre à jour les titres et les médias</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {loading ?
            <div id= "upload-containerLoader">
                    <Loader id="upload-loader" active inline='centered' />
                    <p id= "upload-paragraph">Mise à jour en cour ... </p>
            </div>
                : null}
                { uploadDoc ? 
            <div id="upload-containerDoc">
                <div id="upload-containerGoogleSheetTitle">
                    <h3 id="upload-subtitle">Votre document GoogleSheet Titres a été mis à jour !
                     <br /> Vous souhaitez consulter votre document ? cliquez sur ce lien : 
                    </h3>
                    <div id= "upload-containerLinkImg">
                        <a href="https://docs.google.com/spreadsheets/d/1fDDccNM-8kFfWvUmKcViJEkOfyq3uqPGOlTq2azVclY" target="_blank" rel="noopener noreferrer">
                            <img
                                alt="logo"
                                id="upload-img"
                                src={sheetColor}
                            />
                        </a>
                    </div>
                </div>
                <div id="upload-containerGoogleSheetMedia">
                    <h3 id="upload-subtitle">Votre document GoogleSheet Médias a été mis à jour !
                     <br /> Vous souhaitez consulter votre document ? cliquez sur ce lien : 
                    </h3>
                    <div id="upload-containerLinkImg">
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
                    : null}
        </div>
    );
}

export default Upload;
