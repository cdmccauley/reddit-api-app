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
    this.validateUrl = this.validateUrl.bind(this);
    this.createReq = this.createReq.bind(this);
    this.sendReq = this.sendReq.bind(this);
    this.evaluateRes = this.evaluateRes.bind(this);
    this.handleAccepted = this.handleAccepted.bind(this);
    this.handleRejected = this.handleRejected.bind(this);
    this.handleReqException = this.handleReqException.bind(this);
    this.assignResData = this.assignResData.bind(this);
    this.updateReqSettings = this.updateReqSettings.bind(this);
    this.evaluateReqSettings = this.evaluateReqSettings.bind(this);
    this.getThumbProp = this.getThumbProp.bind(this);
    this.getCreatedProp = this.getCreatedProp.bind(this);
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

  // assign error message to component display
  // TODO: validate arg, use generic if invalid
  displayErrorMsg(message) {
    this.setState((state, props) => { return { componentDisplay: message }});
  }

  // request data set
  reqData(url) {
    this.sendReq(this.createReq(url));
  }

  // validate url for request
  // TODO: validate further than prevent falsy arg
  validateUrl(url) {
    if (url) {
      return url;
    } else {
      return `https://old.reddit.com/r/${ this.state.subreddit }.json?limit=100`;
    }
  }

  // create request from url
  // TODO: add object argument for settings
  createReq(url) {
    return new Request(this.validateUrl(url));
  }

  // handle sendReq fetch response
  handleAccepted(res) {
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
  }

  // handle sendReq fetch rejection
  handleRejected(rej) {
    // stop polling
    clearInterval(this.state.pollRef);
    // handle fetch rejection
    console.log('fetch rejected:\n', rej); // LOG: rejection object
    // display error
    this.setState((state, props) => { return { componentDisplay: `error: request rejected, invalid search url or request blocked by browser. check search url, browser settings, or console for more details.` }});
    // call handleRes with null
    return null;
  }

  // handle sendReq fetch exception
  handleReqException(e) {
    // stop polling
    clearInterval(this.state.pollRef);
    // handle fetch exception
    console.log('fetch exception:\n', e); // LOG: exception object
    // display error
    this.setState((state, props) => { return { componentDisplay: `error: fetch exception, check console for details.` } });
  }

  // send a request
  sendReq(req) {
    fetch(req)
    .then((accepted) => this.handleAccepted(accepted), (rejected) => this.handleRejected(rejected))
    .then((res) => this.evaluateRes(res))
    .catch((e) => this.handleReqException(e));
  }

  // evaluate sendReq res
  evaluateRes(res) {
    console.log('server response:\n', res); // DEBUG: log response from reddit
    if (res) {
      // res should contain valid data, assign to state
      this.assignResData(res);
    } else if (res !== null) {
      // unexpected behavior that will cause errors, display message
      this.displayErrorMsg('error: evaluateRes passed non-null, falsy argument. check console for more details.');
    }
  }

  // assign response data to state, then update counter
  assignResData(res) {
    this.setState((state, props) => { return { listings: [...state.listings, res] } }, () => this.updateReqSettings());
  }

  // update request counter, then evaluate settings
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

  // return valid url for thumb img
  // TODO: investigate response data for patterns, different subs provide different values for this prop
  getThumbProp(thumb) {
    return thumb.substring(0, 4) !== 'http' ? `https://via.placeholder.com/140x90/333/FFF/?text=${ thumb }` : thumb;
  }

  // return converted time
  getCreatedProp(created_utc) {
    return created_utc * 1000;
  }

  // parse response data
  // TODO: instead of storing posts then creating elements on the fly, store elements and update them on the fly?
  parseData() {
    // declarations
    let knownPosts = this.state.posts;
    let unknownPosts = [];
    // look at each listing
    Object.values(this.state.listings).forEach((listing) => {
      // look at each post in listing
      Object.values(listing.data.children).forEach((child) => {
        if (Object.keys(this.state.posts).includes(child.data.id)) {
          // post is currently in state
          if (knownPosts[child.data.id].ups !== child.data.ups) {
            // update post values
            knownPosts[child.data.id].ups = child.data.ups;
            knownPosts[child.data.id].score = child.data.score;
          }
        } else {
          // post is not currently in state, assign relevant data to object
          unknownPosts[child.data.id] = {
            id: child.data.id,
            name: child.data.name,
            created: this.getCreatedProp(child.data.created_utc),
            title: child.data.title,
            author: child.data.author,
            subreddit: child.data.subreddit_name_prefixed,
            comments: child.data.permalink,
            ups: child.data.ups,
            score: child.data.score,
            domain: child.data.domain,
            url: child.data.url,
            thumb: this.getThumbProp(child.data.thumbnail),
            thumbHeight: child.data.thumbnail_height,
            thumbWidth: child.data.thumbnail_width,
          };
        }
      })
    });
    // combine post arrays
    Object.keys(unknownPosts).forEach((key) => {
      knownPosts[key] = unknownPosts[key];
    });
    // store posts then make list items from them
    this.setState((state, props) => {
      return {
        listings: [],
        posts: knownPosts,
      }
    }, () => this.getListItems());
  }

  // return post age as decimal representation of hours
  getPostAge(created, now) {
    return Math.round(((now - created) / 3600000) * 100) / 100;
  }

  // return decimal representation of average ups per hour
  getPostUpsAvg(created, now, ups) {
    return Math.round(((Math.round(ups / (Math.round(((now - created) / 3600000) * 100) / 100))) / 60) * 100) / 100;
  }

  // return post title div
  getPostTitleElement(path, title) {
    return (
      <div className='title'>
        <a href={ `https://reddit.com${ path }` } target='_blank' rel='noopener noreferrer'>{ title }</a>
      </div>
    );
  }

  // return post details div
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

  // return post source div
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

  // return post list item
  getPostElement(post, now) {
    return (
      <li key={ post.id } >
        { this.getPostTitleElement(post.comments, post.title) }
        { this.getPostDetailsElement(post.ups, post.created, now, post.url, post.thumb, post.title) }
        { this.getPostSourceElement(post.subreddit, post.domain) }
      </li>
    );
  }

  // set state with list item elements
  getListItems() {
    let now = new Date().getTime();
    let listItems = Object.values(this.state.posts).map((post) => this.getPostElement(post, now));
    listItems = this.sortListItems(listItems);
    this.setState((state, props) => { return { allListItems: listItems } }, () => this.filterListItems());
  }

  // sort list items by ups average
  sortListItems(list) {
    return list.sort((a, b) => { return b.props.children[1].props.children[0].props.children[2].props.children.props.children[0] - a.props.children[1].props.children[0].props.children[2].props.children.props.children[0]})
  }

  // filter list items by age
  // TODO: add buttons to alter the data set, maybe something like top/?sort=top&t=week
  filterListItems() {
    let filteredList = this.state.allListItems.filter((title) => { return title.props.children[1].props.children[0].props.children[1].props.children.props.children[1] < this.state.maxAge });
    if (filteredList.length === 0) {
      filteredList = `0/${this.state.allListItems.length} posts with age under ${this.state.maxAge} hours.\ntry increasing max age.\n`;
    } 
    this.setState((state, props) => { return { componentDisplay: filteredList }});
  }

  // handle component submit events
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
                <input style={{flexGrow: '0'}} type='text' id={`sub-value${ this.props.listNum }`} className='sub-value' placeholder={ this.state.subreddit }></input>
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
