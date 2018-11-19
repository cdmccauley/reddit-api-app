import React, { Component } from 'react';
import './App.css';

class App extends Component {

  constructor() {
    super();
    this.state = {
      fetchLimit: 2,
      fetchCount: 0,
      maxAge: 3,
      subreddit: 'politics',
      listings: [],
      posts: [],
      allTitles: [],
      displayTitles: 'loading...',
    }

    // this.createReq = this.createReq.bind(this);
    // this.sendReq = this.sendReq.bind(this);

    this.reqData = this.reqData.bind(this);
    this.handleRes = this.handleRes.bind(this);
    this.parseListings = this.parseListings.bind(this);
    this.getListItems = this.getListItems.bind(this);

    this.sortListItems = this.sortListItems.bind(this);
    this.filterListItems = this.filterListItems.bind(this);

    this.componentDidMount = this.componentDidMount.bind(this);
  }

  componentDidMount() {
    // let timeout = 3000;
    let interval = 60000;

    this.reqData();
    // this.sendReq();
    
    // setTimeout(() => this.reqData(), timeout);
    // setTimeout(() => this.sendReq(), timeout);
    
    setInterval(() => this.reqData(), interval);
    // setInterval(() => this.sendReq(), interval);
  }

  reqData(url) {
    let fetchUrl, req;
    url ? fetchUrl = url : fetchUrl = `https://old.reddit.com/r/${ this.state.subreddit }.json?limit=100`;
    // console.log('fetchUrl:\n', fetchUrl); // DEBUG: log req url
    req = new Request(fetchUrl);
    fetch(req)
    .then((fulfilled) => { return fulfilled.json() }, (rejected) => {
      console.log('fetch rejected:\n', rejected);
      this.setState((state, props) => { return { displayTitles: 'error: fetch rejected by browser.'}})
    })
    .then((res) => { res ? this.handleRes(res) : console.log('falsy response:\n', res) })
    .catch((err) => console.log('fetch error:\n', err));
  }

  // createReq(method, url) {
  //   let createReqXhr = new XMLHttpRequest();
  //   if ("withCredentials" in createReqXhr) {
  //     createReqXhr.open(method, url, true);
  //   } else if (typeof XDomainRequest != "undefined") {
  //     // TODO: support IE XDomainRequest class
  //     // createReqXhr = new XDomainRequest();
  //     // createReqXhr.open(method, url);
  //     console.log('createReq function error: XDomainRequest currently unsupported.');
  //     this.setState((state, props) => { return { displayTitles: 'createReq function error: XDomainRequest currently unsupported.' }});
  //     createReqXhr = null;
  //   } else {
  //     console.log('createReq function error: CORS not supported by client.');
  //     this.setState((state, props) => { return { displayTitles: 'createReq function error: CORS not supported by client.' }});
  //     createReqXhr = null;
  //   }
  //   return createReqXhr;
  // }

  // sendReq(url) {
  //   let sendReqUrl, sendReqXhr;
  //   let sendReqContext = this;
  //   url ? sendReqUrl = url : sendReqUrl = `https://old.reddit.com/r/${ this.state.subreddit }.json?limit=100`;
  //   sendReqXhr = this.createReq('GET', sendReqUrl);
  //   if (sendReqXhr) {
  //     sendReqXhr.responseType = "json";
  //     sendReqXhr.onload = () => {
  //       sendReqContext.handleRes(sendReqXhr.response);
  //     }
  //     sendReqXhr.onerror = (error) => {
  //       console.log('sendReq function error: XHR error\n', error);
  //       this.setState((state, props) => { return { displayTitles: 'sendReq function error: XHR error: ' + JSON.stringify(error, ['message', 'arguments', 'type', 'name'])}});
  //     }
  //     sendReqXhr.send();
  //   };
  // }

  // TODO: remove max reqs and just poll for 100 instead of replaying
  handleRes(res) {
    console.log('server response:\n', res); // DEBUG: log response from reddit
    this.setState((state, props) => {
      return {
        fetchCount: state.fetchCount + 1,
        listings: [...state.listings, res]
      }
    }, () => {
      if (this.state.fetchCount < this.state.fetchLimit && this.state.listings[+this.state.fetchCount - 1].data.after) {
        // this.sendReq(`https://old.reddit.com/r/${ this.state.subreddit }.json?after=${ this.state.listings[this.state.fetchCount - 1].data.after }`);
        this.reqData(`https://old.reddit.com/r/${ this.state.subreddit }.json?limit=100&after=${ this.state.listings[this.state.fetchCount - 1].data.after }`);
      } else {
        this.setState((state, props) => {
          return {
            fetchCount: 0
          }
        }, () => this.parseListings());
      };
    });
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
    // if (Object.keys(this.state.posts).length > 0) {
    //   Object.values(this.state.listings).forEach((listing) => {
    //     Object.values(listing.data.children).forEach((child) => {
    //       if (Object.keys(this.state.posts).includes(child.data.id)) {
    //         if (combinedArr[child.data.id].ups !== child.data.ups) {
    //           combinedArr[child.data.id].ups = child.data.ups;
    //           combinedArr[child.data.id].score = child.data.score;
    //         }
    //       } else {
    //         tempPostsArr[child.data.id] = {
    //           id: child.data.id,
    //           name: child.data.name,
    //           created: child.data.created_utc,
    //           title: child.data.title,
    //           author: child.data.author,
    //           comments: child.data.permalink,
    //           ups: child.data.ups,
    //           score: child.data.score,
    //           domain: child.data.domain,
    //           url: child.data.url,
    //           thumb: child.data.thumbnail,
    //           thumbHeight: child.data.thumbnail_height,
    //           thumbWidth: child.data.thumbnail_width,
    //         };
    //       }
    //     })
    //   })
    // } else {
    //   Object.values(this.state.listings).forEach((listing) => {
    //     Object.values(listing.data.children).forEach((child) => {
    //       tempPostsArr[child.data.id] = {
    //         id: child.data.id,
    //         name: child.data.name,
    //         created: child.data.created_utc * 1000,
    //         title: child.data.title,
    //         author: child.data.author,
    //         comments: child.data.permalink,
    //         ups: child.data.ups,
    //         score: child.data.score,
    //         domain: child.data.domain,
    //         url: child.data.url,
    //         thumb: child.data.thumbnail,
    //         thumbHeight: child.data.thumbnail_height,
    //         thumbWidth: child.data.thumbnail_width,
    //       };
    //     });
    //   });
    // };
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
          <a href={ `https://old.reddit.com${post.comments}` } target='_blank' rel='noopener noreferrer'>
            { post.title }
          </a>
        </div>
        <div className='details'>
          <div className='stats'>
            <span className='ups'>
              <p>ups: { post.ups }</p>
            </span>
            <span className='ages'>
              <p>age: { (Math.round(((now - post.created) / 3600000) * 100) / 100) }</p>
            </span>
            <span className='avgs'>
              <p>{ Math.round(((Math.round(post.ups / (Math.round(((now - post.created) / 3600000) * 100) / 100))) / 60) * 100) / 100 } ups/min</p>
            </span>
          </div>
          <a href={ post.url } target='_blank' rel='noopener noreferrer'>
            <img src={ post.thumb } alt={ post.title }/>
          </a>
        </div>
        { this.state.subreddit.substring() === 'all' ? <div className='source' style={{ justifyContent: 'space-between' }}><small>{ post.subreddit}</small><small>{ post.domain }</small></div> : <div className='source' style={{ justifyContent: 'flex-end' }}><small>{ post.domain }</small></div>}
      </li>
    ));
    // listItems.sort((a, b) => { return b.props.children[0].props.children[2].props.children - a.props.children[0].props.children[2].props.children });
    listItems = this.sortListItems(listItems);
    // console.log(listItems[0].props.children[1].props.children[0].props.children[2].props.children.props.children[0]);
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
    // return list.sort((a, b) => { return b.props.children[0].props.children[2].props.children - a.props.children[0].props.children[2].props.children });
    // return list.sort((a, b) => { return b.props.children[2].props.children - a.props.children[2].props.children });
    return list.sort((a, b) => { return b.props.children[1].props.children[0].props.children[2].props.children.props.children[0] - a.props.children[1].props.children[0].props.children[2].props.children.props.children[0]})
  }

  filterListItems() {
    // let filteredList = this.state.allTitles.filter((title) => { return title.props.children[0].props.children[1].props.children < this.state.maxAge });
    // let filteredList = this.state.allTitles.filter((title) => { return title.props.children[1].props.children < this.state.maxAge });
    let filteredList = this.state.allTitles.filter((title) => { return title.props.children[1].props.children[0].props.children[1].props.children.props.children[1] < this.state.maxAge });
    // console.log(this.state.allTitles[0].props.children[1].props.children[0].props.children[1].props.children.props.children[1]);
    this.setState((state, props) => { return { displayTitles: filteredList }});
    // this.setState((state, props) => { return { displayTitles: filteredList }}, () => console.log('post filter state:\n', this.state, `\nstate.displayTitles.length: ${ this.state.displayTitles.length }`));
  }

  render() {
    return (
      <React.Fragment>
        <ul>
          {/* <li id='head'><span className='ups'>ups</span><span className='ages'>age</span><span className='avgs'>/min</span><span>title</span></li> */}
          { this.state.displayTitles }
        </ul>
      </React.Fragment>
    );
  }
}

export default App;
