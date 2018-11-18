import React, { Component } from 'react';
import './App.css';

class App extends Component {

  constructor() {
    super();
    this.state = {
      xhrReqLimit: 4,
      xhrReqCount: 0,
      subreddit: 'politics',
      listings: [],
      posts: [],
      titles: 'loading...',
    }

    this.createReq = this.createReq.bind(this);
    this.sendReq = this.sendReq.bind(this);
    this.handleRes = this.handleRes.bind(this);

    this.parseListings = this.parseListings.bind(this);
    this.getListItems = this.getListItems.bind(this);

  }

  componentDidMount() {
    this.sendReq();
    // this.sendReq('https://www.reddit.com/r/politics/top.json');
    // this.sendReq('https://www.reddit.com/r/politics/rising.json');
    // this.sendReq('https://www.reddit.com/r/politics/new.json');
    // this.sendReq();
    // setTimeout(() => this.sendReq(), 3000);
    // setInterval(() => this.sendReq(), 5000);
    // setInterval(() => this.sendReq(), 10000);
    // setInterval(() => this.sendReq(), 15000);
    // setInterval(() => this.sendReq(), 30000);
    setInterval(() => {
      this.sendReq();
      // this.sendReq('https://www.reddit.com/r/politics/rising.json');
    }, 60000);
  }

  createReq(method, url) {
    let createReqXhr = new XMLHttpRequest();
    if ("withCredentials" in createReqXhr) {
      createReqXhr.open(method, url, true);
    } else if (typeof XDomainRequest != "undefined") {
      // TODO: support IE XDomainRequest class
      // createReqXhr = new XDomainRequest();
      // createReqXhr.open(method, url);
      console.log('createReq function error: XDomainRequest currently unsupported.');
      createReqXhr = null;
    } else {
      console.log('createReq function error: CORS not supported by client.');
      createReqXhr = null;
    }
    return createReqXhr;
  }

  sendReq(url) {
    let sendReqUrl, sendReqXhr;
    let sendReqContext = this;
    url ? sendReqUrl = url : sendReqUrl = `https://reddit.com/r/${ this.state.subreddit }.json`;
    sendReqXhr = this.createReq('GET', sendReqUrl);
    if (sendReqXhr) {
      sendReqXhr.responseType = "json";
      sendReqXhr.onload = () => {
        sendReqContext.handleRes(sendReqXhr.response);
      }
      sendReqXhr.onerror = (error) => {
        console.log('sendReq function error: XHR error\n', error);
      }
      sendReqXhr.send();
    };
  }

  handleRes(res) {
    console.log('server response:\n', res); // DEBUG: log response from reddit
    this.setState((state, props) => {
      return {
        xhrReqCount: state.xhrReqCount + 1,
        listings: [...state.listings, res]
      }
    }, () => {
      if (this.state.xhrReqCount < this.state.xhrReqLimit && this.state.listings[this.state.xhrReqCount - 1].data.after) {
        this.sendReq(`https://reddit.com/r/${ this.state.subreddit }.json?after=${ this.state.listings[this.state.xhrReqCount - 1].data.after }`);
      } else {
        this.setState((state, props) => {
          return {
            xhrReqCount: 0
          }
        }, () => this.parseListings());
      };
    });
  }

  parseListings() {
    let combinedArr = this.state.posts;
    let tempPostsArr = [];
    if (Object.keys(this.state.posts).length > 0) {
      Object.values(this.state.listings).forEach((listing) => {
        Object.values(listing.data.children).forEach((child) => {
          if (Object.keys(this.state.posts).includes(child.data.id)) {
            if (combinedArr[child.data.id].ups !== child.data.ups) {
              combinedArr[child.data.id].ups = child.data.ups;
              combinedArr[child.data.id].score = child.data.score;
            }
          } else {
            tempPostsArr[child.data.id] = {
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
            };
          }
        })
      })
    } else {
      Object.values(this.state.listings).forEach((listing) => {
        Object.values(listing.data.children).forEach((child) => {
          tempPostsArr[child.data.id] = {
            id: child.data.id,
            name: child.data.name,
            created: child.data.created_utc * 1000,
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
          };
        });
      });
    };
    Object.keys(tempPostsArr).forEach((key) => {
      combinedArr[key] = tempPostsArr[key];
    });
    this.setState((state, props) => {
      return {
        listings: [],
        posts: combinedArr,
      }
    }, () => this.getListItems());
  }

  getListItems() {
    let now = new Date().getTime();
    let listItems = Object.values(this.state.posts).map((post) => (
      <li key={ post.id } >
        <span className='ups'>
          { post.ups }
        </span>
        <span className='ages'>
          { Math.round(((Math.round(post.ups / (Math.round(((now - post.created) / 3600000) * 100) / 100))) / 60) * 100) / 100 }
        </span>
        <a href={ `https://www.reddit.com${post.comments}` } target='_blank' rel='noopener noreferrer'>
          { post.title }
        </a>
      </li>
    ));
    listItems.sort((a, b) => { return b.props.children[1].props.children - a.props.children[1].props.children });
    this.setState((state, props) => {
      return { titles: listItems }
    }, () => console.log('state:\n', this.state, `\nstate.posts.length: ${Object.keys(this.state.posts).length}`));
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
