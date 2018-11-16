import React, { Component } from 'react';
import './App.css';

class App extends Component {

  constructor() {
    super();
    this.state = {
      maxCORSReq: 2,
      corsReqCount: 0,
      subreddit: 'politics/new',
      listings: [],
      posts: [],
      titles: 'loading...',
    }

    this.createCORSRequest = this.createCORSRequest.bind(this);
    this.sendCORSRequest = this.sendCORSRequest.bind(this);

    this.parseListings = this.parseListings.bind(this);
    this.getNewPosts = this.getNewPosts.bind(this);
  }

  componentDidMount() {
    this.sendCORSRequest();
    // setInterval(() => this.sendCORSRequest(), 10000);
    // setInterval(() => this.sendCORSRequest(), 15000);
    // setInterval(() => this.sendCORSRequest(), 30000);
  }

  createCORSRequest(method, url) {
    let createCORSReqXhr = new XMLHttpRequest();
    if ("withCredentials" in createCORSReqXhr) {
      createCORSReqXhr.open(method, url, true);
    } else if (typeof XDomainRequest != "undefined") {
      // xhr = new XDomainRequest(); // related to IE
      // xhr.open(method, url);
      console.log('createCORSRequest function error: no XDomainRequest class defined.');
      return null; // prevent continuation
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
          }, sendCORSReqContext.parseListings());
        };
      });
    }
    sendCORSReqXhr.onerror = (error) => {
      console.log('sendCORSRequest function error: XHR error');
      console.log(error);
    }
    sendCORSReqXhr.send();
  }

  /*

  don't want to keep spending so much on processing objects
  restructure objects to enable using ids to check for dups
  process:
  call api, iterate through to find children that aren't in state
  send children to be added to state if not in current set
  then check differences between ups, if different overwrite ups

  getListings, getNewPosts, getUpdatedUps, setState

  */
  getNewPosts(listings) {
    
  }

  parseListings() {
    let tempPosts = [];
    Object.values(this.state.listings).forEach((listing) => {
      Object.values(listing.data.children).forEach((child) => {
        let post = {
          id: child.data.id,
          name: child.data.name,
          created: child.data.created_utc,
          title: child.data.title,
          author: child.data.author,
          comments: child.data.permalink,
          ups: child.data.ups,
          score: child.data.score,
          domain: child.data.domain,
          url: child.data.url,
          thumb: child.data.thumbnail,
          thumbHeight: child.data.thumbnail_height,
          thumbWidth: child.data.thumbnail_width,
        }
        tempPosts.push(post);
      })
    });
    tempPosts.sort((a, b) => { return b.ups - a.ups });

    // // DEBUG: testing area
    // if (Object.keys(this.state.posts).length > 0) {
    //   Object.values(this.state.listings).forEach((listing) => {
    //     Object.values(listing.data.children).forEach((child) => {
    //       Object.values(this.state.posts).forEach((post) => {
    //         if (!Object.values(post).includes(child.data.id)) {
    //           // unknown post detected
    //           // triggers 2450 times ??
    //           // have 50 posts when this happens
    //           // iterating over every prop of object, recognizes 50 of them...
    //           // too much iterating happening here
    //           console.log('unknown post');
    //         };
    //       });
    //     });
    //   });
    // };
    // // DEBUG: end testing area

    this.setState({
      listings: [],
      posts: tempPosts,
      titles: tempPosts.map((post) => <li key={ post.id } ><span className='ups'>{ post.ups }</span><a href={ post.url }>{ post.title }</a></li>)
    }, () => console.log(this.state));
  }

  render() {
    return (
      <React.Fragment>
        <ul>
          { this.state.titles }
        </ul>
      </React.Fragment>
    );
  }
}

export default App;
