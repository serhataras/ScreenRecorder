import '../public/assets/styles/index.css';
import App from './App';
import React from 'react';
import ReactDOM from 'react-dom'


export let configs : any = {};

let parser = document.createElement('a'),
    searchObject = {},
    queries, split, i;
// Let the browser do the work
parser.href = location.href;
// Convert query string to object
queries = parser.search.replace(/^\?/, '').split('&');
for ( i = 0; i < queries.length; i++ ) {
  split = queries[i].split('=');
  // @ts-ignore
  searchObject[split[0]] = split[1];
}

configs.localOrigin = parser.origin;
configs.localUrl = parser.origin.substring(0, parser.origin.lastIndexOf(parser.port) - 1);

const rootElement = document.getElementById('root');

async function initialize () {
  ReactDOM.render(
      <App/>
      , rootElement
  );
}

initialize().then();



