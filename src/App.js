import React, { Component } from 'react';
import './App.css';

class App extends Component {

  constructor() {
    super();
    this.state = {
      maxCORSReq: 4,
      corsReqCount: 0,
      subreddit: 'politics',
      listings: [],
      posts: [],
      titles: null,
    }

    this.createCORSRequest = this.createCORSRequest.bind(this);
    this.sendCORSRequest = this.sendCORSRequest.bind(this);

    this.storeTitles = this.storeTitles.bind(this);
  }

  componentDidMount() {
    this.sendCORSRequest();
    setInterval(() => this.sendCORSRequest(), 30000);
  }

  createCORSRequest(method, url) {
    var createCORSReqXhr = new XMLHttpRequest();
    if ("withCredentials" in createCORSReqXhr) {
      createCORSReqXhr.open(method, url, true);
    } else if (typeof XDomainRequest != "undefined") {
      // xhr = new XDomainRequest(); // related to IE
      // xhr.open(method, url);
      console.log('createCORSRequest function error: no XDomainRequest class defined.');
    } else {
      createCORSReqXhr = null;
    }
    return createCORSReqXhr;
  }

  sendCORSRequest(url) {
    let sendCORSReqUrl, sendCORSReqXhr;
    let sendCORSReqContext = this;
    url ? sendCORSReqUrl = url : sendCORSReqUrl = `https://reddit.com/r/${ this.state.subreddit }.json`;
    sendCORSReqXhr = this.createCORSRequest('GET', sendCORSReqUrl);
    if (!sendCORSReqXhr) {
      console.log('sendCORSRequest function error: CORS not supported.');
      return;
    } else {
      sendCORSReqXhr.responseType = "json";
    }
    sendCORSReqXhr.onload = () => {
      console.log(sendCORSReqXhr.response); // DEBUG: log response from reddit
      sendCORSReqContext.setState({
        corsReqCount: sendCORSReqContext.state.corsReqCount + 1,
        listings: [...sendCORSReqContext.state.listings, sendCORSReqXhr.response]
      }, () => {
        if (sendCORSReqContext.state.corsReqCount < sendCORSReqContext.state.maxCORSReq) {
          sendCORSReqContext.sendCORSRequest(`https://reddit.com/r/${ this.state.subreddit }.json?after=${ sendCORSReqContext.state.listings[sendCORSReqContext.state.corsReqCount - 1].data.after }`);
        } else {
          sendCORSReqContext.setState({
            corsReqCount: 0
          }, sendCORSReqContext.storeTitles());
        };
      });
    }
    sendCORSReqXhr.onerror = (error) => {
      console.log('sendCORSRequest function error: XHR error');
      console.log(error);
    }
    sendCORSReqXhr.send();
  }

  storeTitles() {
    let tempPosts = [];
    Object.values(this.state.listings).forEach((listing) => {
      Object.values(listing.data.children).forEach((child) => {
        tempPosts.push(child);
      })
    });
    tempPosts.sort((a, b) => { return b.data.ups - a.data.ups });
    this.setState({
      listings: [],
      posts: [...tempPosts],
      titles: tempPosts.map((post) => <li key={ post.data.id } >{ post.data.title + '...' + post.data.ups }</li>)
    }, () => console.log(this.state)); // DEBUG: log updated state
  }

  render() {
    return (
      <div className="App">
        <ul style={{ fontSize: '1.25em', listStyleType: 'none', paddingLeft: '0', margin: '0' }}>
          { this.state.titles }
        </ul>
      </div>
    );
  }
}

export default App;
