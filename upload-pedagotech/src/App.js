import React from "react";
import './App.scss';
import Upload from './Upload';

const App = () => {

  return (
    <div id="app">
      <header>
        <h1 id="app-title"> Mise à jour Spotify des titres et médias </h1>
      </header>
      <Upload />
    </div>
  );
}

export default App;
