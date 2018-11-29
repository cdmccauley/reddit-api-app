import React, { Component } from 'react';
import './App.css';

class App extends Component {

  constructor() {
    super();
    this.state = {
      fetchLimit: 2,
      fetchCount: 0,
      maxAge: 2,
      subreddit: 'politics',
      listings: [],
      posts: [],
      allTitles: [],
      displayTitles: 'loading...',
      interval: 60000,
      pollRef: null,
    }

    this.componentDidMount = this.componentDidMount.bind(this);
    this.displayErrorMsg = this.displayErrorMsg.bind(this);
    // this.reqData = this.reqData.bind(this);
    this.tempReqData = this.tempReqData.bind(this);
    this.createReq = this.createReq.bind(this);
    this.validateUrl = this.validateUrl.bind(this);
    this.sendReq = this.sendReq.bind(this);
    this.validateRes = this.validateRes.bind(this);
    this.assignResData = this.assignResData.bind(this);
    this.updateReqSettings = this.updateReqSettings.bind(this);
    this.evaluateReqSettings = this.evaluateReqSettings.bind(this);
    this.parseListings = this.parseListings.bind(this);
    this.getListItems = this.getListItems.bind(this);
    this.sortListItems = this.sortListItems.bind(this);
    this.filterListItems = this.filterListItems.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    // get initial data set
    // this.reqData();
    this.tempReqData();
    // begin polling interval, store reference for cancelling
    // this.setState((state, props) => { return { pollRef: setInterval(() => this.reqData(), this.state.interval) } });
    this.setState((state, props) => { return { pollRef: setInterval(() => this.tempReqData(), this.state.interval) } });
  }

  // TODO: validate arg, use generic if invalid
  displayErrorMsg(message) {
    this.setState((state, props) => { return { displayTitles: message }});
  }

  // make request for data set
  // TODO: sanitize argued url? check to see if polling actually needs to be stopped or if it is stopped elsewhere.
  // CANDIDATES: setup req, fetch req, create req error handlers
  // reqData(reqUrl) {
  //   // declarations
  //   let url, req;
  //   // use reqUrl argument if present, else use default url
  //   reqUrl ? url = reqUrl : url = `https://old.reddit.com/r/${ this.state.subreddit }.json?limit=100`;
  //   // console.log('url:\n', url); // DEBUG: log req url
  //   // instantiate Request
  //   req = new Request(url, { method: 'GET', mode: 'cors', redirect: 'error' });
  //   // request data with fetch
  //   fetch(req)
  //   .then((res) => { 
  //     if (res.ok) {
  //       // handle valid response, return res.body as json for use in handleRes
  //       return res.json();
  //     } else {
  //       // stop polling
  //       clearInterval(this.state.pollRef);
  //       // handle invalid response
  //       console.log('network error:\n', res); // LOG: response object
  //       // display error
  //       this.setState((state, props) => { return { displayTitles: `error: response from "${res.url}" was "${res.status}: ${res.statusText}".` }});
  //       // return null for use in handleRes
  //       return null;
  //     }
  //   }, (rej) => {
  //     // stop polling
  //     clearInterval(this.state.pollRef);
  //     // handle fetch rejection
  //     console.log('fetch rejected:\n', rej); // LOG: rejection object
  //     // display error
  //     this.setState((state, props) => { return { displayTitles: `error: request rejected, invalid search url or request blocked by browser. check search url, browser settings, or console for more details.` }});
  //     // call handleRes with null
  //     return null;
  //   })
  //   .then((resJSON) => this.validateRes(resJSON)) // call handleRes with json data or null
  //   .catch((e) => {
  //     // stop polling
  //     clearInterval(this.state.pollRef);
  //     // handle fetch exception
  //     console.log('fetch exception:\n', e); // LOG: exception object
  //     // display error
  //     this.setState((state, props) => { return { displayTitles: `error: fetch exception, check console for details.` } });
  //   });
  // }

  tempReqData(url) {
    this.sendReq(this.createReq(url));
  }

  createReq(url) {
    return new Request(this.validateUrl(url));
  }

  // TODO: validate further than prevent falsy arg
  validateUrl(url) {
    if (url) {
      return url;
    } else {
      return `https://old.reddit.com/r/${ this.state.subreddit }.json?limit=100`;
    }
  }

  sendReq(req) {
    fetch(req)
    .then((res) => { 
      if (res.ok) {
        // handle valid response, return res.body as json for use in handleRes
        return res.json();
      } else {
        // stop polling
        clearInterval(this.state.pollRef);
        // handle invalid response
        console.log('network error:\n', res); // LOG: response object
        // display error
        this.setState((state, props) => { return { displayTitles: `error: response from "${res.url}" was "${res.status}: ${res.statusText}".` }});
        // return null for use in handleRes
        return null;
      }
    }, (rej) => {
      // stop polling
      clearInterval(this.state.pollRef);
      // handle fetch rejection
      console.log('fetch rejected:\n', rej); // LOG: rejection object
      // display error
      this.setState((state, props) => { return { displayTitles: `error: request rejected, invalid search url or request blocked by browser. check search url, browser settings, or console for more details.` }});
      // call handleRes with null
      return null;
    })
    .then((resJSON) => this.validateRes(resJSON)) // call handleRes with json data or null
    .catch((e) => {
      // stop polling
      clearInterval(this.state.pollRef);
      // handle fetch exception
      console.log('fetch exception:\n', e); // LOG: exception object
      // display error
      this.setState((state, props) => { return { displayTitles: `error: fetch exception, check console for details.` } });
    });
  }

  // validate response object
  validateRes(res) {
    console.log('server response:\n', res); // DEBUG: log response from reddit
    if (res) {
      this.assignResData(res);
    } else if (res !== null) {
      this.displayErrorMsg('error: validateRes passed non-null, falsy argument. check console for more details.');
    }
  }

  // assign response data to state
  assignResData(res) {
    this.setState((state, props) => { return { listings: [...state.listings, res] } }, () => this.updateReqSettings());
  }

  // update request counter
  updateReqSettings() {
    this.setState((state, props) => { return { fetchCount: state.fetchCount + 1 } }, () => this.evaluateReqSettings());
  }

  // evaluate request settings to determine if another request is required or if data should be parsed
  evaluateReqSettings() {
    if (this.state.fetchCount < this.state.fetchLimit && this.state.listings[+this.state.fetchCount - 1].data.after) {
      this.tempReqData(`https://old.reddit.com/r/${ this.state.subreddit }.json?limit=100&after=${ this.state.listings[this.state.fetchCount - 1].data.after }`);
    } else {
      this.setState((state, props) => { return { fetchCount: 0 } }, () => this.parseListings());
    };
  }

  parseListings() {
    let combinedArr = this.state.posts;
    let tempPostsArr = [];
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
            created: child.data.created_utc * 1000,
            title: child.data.title,
            author: child.data.author,
            subreddit: child.data.subreddit_name_prefixed,
            comments: child.data.permalink,
            ups: child.data.ups,
            score: child.data.score,
            domain: child.data.domain,
            url: child.data.url,
            thumb: child.data.thumbnail.substring(0, 4) !== 'http' ? `https://via.placeholder.com/140x90/333/FFF/?text=${ child.data.thumbnail }` : child.data.thumbnail,
            thumbHeight: child.data.thumbnail_height,
            thumbWidth: child.data.thumbnail_width,
          };
        }
      })
    });
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
        <div className="title">
          <a href={ `https://reddit.com${post.comments}` } target='_blank' rel='noopener noreferrer'>
            { post.title }
          </a>
        </div>
        <div className='details'>
          <div className='stats'>
            <span>
              <p><span className='ups'>ups</span>: { post.ups }</p>
            </span>
            <span className='ages'>
              <p>age: { (Math.round(((now - post.created) / 3600000) * 100) / 100) }</p>
            </span>
            <span className='avgs'>
              <p>{ Math.round(((Math.round(post.ups / (Math.round(((now - post.created) / 3600000) * 100) / 100))) / 60) * 100) / 100 } <span className='ups'>ups</span>/min</p>
            </span>
          </div>
          <a href={ post.url } target='_blank' rel='noopener noreferrer'>
            <img src={ post.thumb } alt={ post.title }/>
          </a>
        </div>
        { this.state.subreddit.substring(0, 3) === 'all' ? 
          <div className='source' style={{ justifyContent: 'space-between' }}>
            <small>{ post.subreddit}</small>
            <small>{ post.domain }</small>
          </div> : 
          <div className='source' style={{ justifyContent: 'flex-end' }}>
            <small>{ post.domain }</small>
          </div>
        }
      </li>
    ));
    listItems = this.sortListItems(listItems);
    this.setState((state, props) => {
      return { 
        allTitles: listItems,
        displayTitles: listItems
      }
    }, () => {
      // console.log('post response state:\n', this.state, `\nstate.posts.length: ${Object.keys(this.state.posts).length}`); // DEBUG: log state
      this.filterListItems();
    });
  }

  sortListItems(list) {
    return list.sort((a, b) => { return b.props.children[1].props.children[0].props.children[2].props.children.props.children[0] - a.props.children[1].props.children[0].props.children[2].props.children.props.children[0]})
  }

  filterListItems() {
    let filteredList = this.state.allTitles.filter((title) => { return title.props.children[1].props.children[0].props.children[1].props.children.props.children[1] < this.state.maxAge });
    // console.log(filteredList.length);
    if (filteredList.length === 0) {
      // TODO: add buttons to alter the data set, maybe something like top/?sort=top&t=week
      filteredList = `0/${this.state.allTitles.length} posts with age under ${this.state.maxAge} hours.\ntry increasing max age.\n`;
    } 
    this.setState((state, props) => { return { displayTitles: filteredList }});
    // this.setState((state, props) => { return { displayTitles: filteredList }}, () => console.log('post filter state:\n', this.state, `\nstate.displayTitles.length: ${ this.state.displayTitles.length }`));
  }

  handleSubmit(event) {
    event.preventDefault();
    if (event.type === 'submit') {
      let val = document.getElementById('sub-value').value;
      if (val.length > 0) {
        clearInterval(this.state.pollRef);
        this.setState((state, props) => { 
          return { 
            subreddit: val,
            listings: [],
            posts: [],
            allTitles: [],
            displayTitles: 'loading...',
          }
        }, () => {
          this.reqData();
          this.setState((state, props) => { return { pollRef: setInterval(() => this.reqData(), this.state.interval) }});
        });
      }
      
    } else if (event.type === 'input') {
      let age = +event.target.value;
      this.setState((state, props) => { return { maxAge: age }}, () => this.filterListItems() );
    }
  }

  // 🔴 <- for copy paste purposes
  render() {
    return (
      <React.Fragment>
        <ul>
          <li>
            <div id='control-header'><span><span className='ups'>ups</span> rate <span style={{ color: 'red' }}>live</span></span><span id='live-indicator' role='img' aria-label='live indicator'>🔴</span></div>
            <div id='controls'>
              <div id='sub-controls'>
              <form onSubmit={ this.handleSubmit }>
                <label style={{flexShrink: '0'}} htmlFor='sub-value'><span id='full-sub-label'>subreddit: r/</span><span id='partial-sub-label'>r/</span></label>
                <input style={{flexGrow: '0'}} type='text' id='sub-value' placeholder={ this.state.subreddit }></input>
                <input style={{flexGrow: '0'}} type='submit' id='sub-submit' value='submit' />
              </form>
              </div>
              <div id='age-controls'>
                <label style={{flexShrink: '0'}}>max age:</label>
                <select id='age-select' onInput={ this.handleSubmit }>
                  <option value='2'>2 hours</option>
                  <option value='3'>3 hours</option>
                  <option value='6'>6 hours</option>
                  <option value='12'>12 hours</option>
                  <option value='24'>24 hours</option>
                </select>
              </div>
            </div>
          </li>
          { this.state.displayTitles }
        </ul>
      </React.Fragment>
    );
  }
}

export default App;
