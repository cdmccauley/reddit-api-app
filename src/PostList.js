import React, { Component } from 'react';

class PostList extends Component {

  constructor() {
    super();

    this.state = {
      fetchLimit: 2,
      fetchCount: 0,
      maxAge: 2,
      subreddit: 'politics',
      listings: [],
      posts: [],
      allListItems: [],
      componentDisplay: 'loading...',
      pollInterval: 60000,
      pollRef: null,
    }

    this.componentDidMount = this.componentDidMount.bind(this);
    this.displayErrorMsg = this.displayErrorMsg.bind(this);
    this.reqData = this.reqData.bind(this);
    this.createReq = this.createReq.bind(this);
    this.validateUrl = this.validateUrl.bind(this);
    this.sendReq = this.sendReq.bind(this);
    this.validateRes = this.validateRes.bind(this);
    this.assignResData = this.assignResData.bind(this);
    this.updateReqSettings = this.updateReqSettings.bind(this);
    this.evaluateReqSettings = this.evaluateReqSettings.bind(this);
    this.parseData = this.parseData.bind(this);
    this.getPostAge = this.getPostAge.bind(this);
    this.getPostUpsAvg = this.getPostUpsAvg.bind(this);
    this.getPostTitleElement = this.getPostTitleElement.bind(this);
    this.getPostDetailsElement = this.getPostDetailsElement.bind(this);
    this.getPostSourceElement = this.getPostSourceElement.bind(this);
    this.getPostElement = this.getPostElement.bind(this);
    this.getListItems = this.getListItems.bind(this);
    this.sortListItems = this.sortListItems.bind(this);
    this.filterListItems = this.filterListItems.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    // get initial data set
    this.reqData();
    // begin polling pollInterval, store reference for cancelling
    this.setState((state, props) => { return { pollRef: setInterval(() => this.reqData(), this.state.pollInterval) } });
  }

  // TODO: validate arg, use generic if invalid
  displayErrorMsg(message) {
    this.setState((state, props) => { return { componentDisplay: message }});
  }

  reqData(url) {
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

  // TODO: extract error handlers
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
        this.setState((state, props) => { return { componentDisplay: `error: response from "${res.url}" was "${res.status}: ${res.statusText}".` }});
        // return null for use in handleRes
        return null;
      }
    }, (rej) => {
      // stop polling
      clearInterval(this.state.pollRef);
      // handle fetch rejection
      console.log('fetch rejected:\n', rej); // LOG: rejection object
      // display error
      this.setState((state, props) => { return { componentDisplay: `error: request rejected, invalid search url or request blocked by browser. check search url, browser settings, or console for more details.` }});
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
      this.setState((state, props) => { return { componentDisplay: `error: fetch exception, check console for details.` } });
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
      this.reqData(`https://old.reddit.com/r/${ this.state.subreddit }.json?limit=100&after=${ this.state.listings[this.state.fetchCount - 1].data.after }`);
    } else {
      this.setState((state, props) => { return { fetchCount: 0 } }, () => this.parseData());
    };
  }

  // TODO: getThumbProp, getCreatedProp
  parseData() {
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

  getPostAge(created, now) {
    return Math.round(((now - created) / 3600000) * 100) / 100;
  }

  getPostUpsAvg(created, now, ups) {
    return Math.round(((Math.round(ups / (Math.round(((now - created) / 3600000) * 100) / 100))) / 60) * 100) / 100;
  }

  getPostTitleElement(path, title) {
    return (
      <div className='title'>
        <a href={ `https://reddit.com${ path }` } target='_blank' rel='noopener noreferrer'>{ title }</a>
      </div>
    );
  }

  getPostDetailsElement(ups, created, now, url, img, title) {
    return (
      <div className='details'>
        <div className='stats'>
          <span><p><span className='ups'>ups</span>: { ups }</p></span>
          <span className='ages'><p>age: { this.getPostAge(created, now) }</p></span>
          <span className='avgs'><p>{ this.getPostUpsAvg(created, now, ups) } <span className='ups'>ups</span>/min</p></span>
        </div>
        <a href={ url } target='_blank' rel='noopener noreferrer'><img src={ img } alt={ title }/></a>
      </div>
    );
  }

  // TODO: validate component sub value more thoroughly
  getPostSourceElement(subreddit, domain) {
    if (this.state.subreddit.substring(0, 3) === 'all') {
      return (
        <div className='source' style={{ justifyContent: 'space-between' }}>
          <small>{ subreddit}</small>
          <small>{ domain }</small>
        </div>
      );
    } else {
      return (
        <div className='source' style={{ justifyContent: 'flex-end' }}>
          <small>{ domain }</small>
        </div>
      );
    }
  }

  getPostElement(post, now) {
    return (
      <li key={ post.id } >
        { this.getPostTitleElement(post.comments, post.title) }
        { this.getPostDetailsElement(post.ups, post.created, now, post.url, post.thumb, post.title) }
        { this.getPostSourceElement(post.subreddit, post.domain) }
      </li>
    );
  }

  getListItems() {
    let now = new Date().getTime();
    let listItems = Object.values(this.state.posts).map((post) => this.getPostElement(post, now));
    listItems = this.sortListItems(listItems);
    this.setState((state, props) => { return { allListItems: listItems } }, () => this.filterListItems());
  }

  sortListItems(list) {
    return list.sort((a, b) => { return b.props.children[1].props.children[0].props.children[2].props.children.props.children[0] - a.props.children[1].props.children[0].props.children[2].props.children.props.children[0]})
  }

  // TODO: add buttons to alter the data set, maybe something like top/?sort=top&t=week
  filterListItems() {
    let filteredList = this.state.allListItems.filter((title) => { return title.props.children[1].props.children[0].props.children[1].props.children.props.children[1] < this.state.maxAge });
    if (filteredList.length === 0) {
      filteredList = `0/${this.state.allListItems.length} posts with age under ${this.state.maxAge} hours.\ntry increasing max age.\n`;
    } 
    this.setState((state, props) => { return { componentDisplay: filteredList }});
  }

  handleSubmit(event) {
    event.preventDefault();
    if (event.type === 'submit') {
      let val = document.getElementById(`sub-value${ this.props.listNum }`).value;
      if (val.length > 0) {
        clearInterval(this.state.pollRef);
        this.setState((state, props) => { 
          return { 
            subreddit: val,
            listings: [],
            posts: [],
            allListItems: [],
            componentDisplay: 'loading...',
          }
        }, () => {
          this.reqData();
          this.setState((state, props) => { return { pollRef: setInterval(() => this.reqData(), this.state.pollInterval) }});
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
                <label style={{flexShrink: '0'}} htmlFor={`sub-value${ this.props.listNum }`}><span id='full-sub-label'>subreddit: r/</span><span id='partial-sub-label'>r/</span></label>
                <input style={{flexGrow: '0'}} type='text' id={`sub-value${ this.props.listNum }`} placeholder={ this.state.subreddit }></input>
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
          { this.state.componentDisplay }
        </ul>
      </React.Fragment>
    );
  }
}

export default PostList;
