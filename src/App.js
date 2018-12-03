import React, { Component } from 'react';
import './App.css';

import PostList from './PostList.js';

class App extends Component {

  render() {
    return (
      <PostList listNum={ 1 } />
    );
  }
}

export default App;
