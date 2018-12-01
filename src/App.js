import React, { Component } from 'react';
import './App.css';

import PostList from './PostList.js';

class App extends Component {

  render() {
    return (
      <React.Fragment>
        <div style={{ display: 'flex', flexDirection: 'row', alignContent: 'flex-start' }}>
          <PostList listNum={ 1 } />
          <PostList listNum={ 2 } />
        </div>
      </React.Fragment>
    );
  }
}

export default App;
