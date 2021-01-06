Utils = {
  setBoardView(view) {
    currentUser = Meteor.user();
    if (currentUser) {
      Meteor.user().setBoardView(view);
    } else if (view === 'board-view-swimlanes') {
      window.localStorage.setItem('boardView', 'board-view-swimlanes'); //true
      location.reload();
    } else if (view === 'board-view-lists') {
      window.localStorage.setItem('boardView', 'board-view-lists'); //true
      location.reload();
    } else if (view === 'board-view-cal') {
      window.localStorage.setItem('boardView', 'board-view-cal'); //true
      location.reload();
    } else {
      window.localStorage.setItem('boardView', 'board-view-swimlanes'); //true
      location.reload();
    }
  },

  unsetBoardView() {
    window.localStorage.removeItem('boardView');
    window.localStorage.removeItem('collapseSwimlane');
  },

  boardView() {
    currentUser = Meteor.user();
    if (currentUser) {
      return (currentUser.profile || {}).boardView;
    } else if (
      window.localStorage.getItem('boardView') === 'board-view-swimlanes'
    ) {
      return 'board-view-swimlanes';
    } else if (
      window.localStorage.getItem('boardView') === 'board-view-lists'
    ) {
      return 'board-view-lists';
    } else if (window.localStorage.getItem('boardView') === 'board-view-cal') {
      return 'board-view-cal';
    } else {
      window.localStorage.setItem('boardView', 'board-view-swimlanes'); //true
      location.reload();
      return 'board-view-swimlanes';
    }
  },

  myCardsSort() {
    let sort = window.localStorage.getItem('myCardsSort');

    if (!sort || !['board', 'dueAt'].includes(sort)) {
      window.localStorage.setItem('myCardsSort', 'board');
      location.reload();
      sort = 'board';
    }

    return sort;
  },

  setMyCardsSort(sort) {
    window.localStorage.setItem('myCardsSort', sort);
    location.reload();
  },

  // XXX We should remove these two methods
  goBoardId(_id) {
    const board = Boards.findOne(_id);
    return (
      board &&
      FlowRouter.go('board', {
        id: board._id,
        slug: board.slug,
      })
    );
  },

  goCardId(_id) {
    const card = Cards.findOne(_id);
    const board = Boards.findOne(card.boardId);
    return (
      board &&
      FlowRouter.go('card', {
        cardId: card._id,
        boardId: board._id,
        slug: board.slug,
      })
    );
  },
  MAX_IMAGE_PIXEL: Meteor.settings.public.MAX_IMAGE_PIXEL,
  COMPRESS_RATIO: Meteor.settings.public.IMAGE_COMPRESS_RATIO,
  processUploadedAttachment(card, fileObj, callback) {
    const next = attachment => {
      if (typeof callback === 'function') {
        callback(attachment);
      }
    };
    if (!card) {
      return next();
    }
    const file = new FS.File(fileObj);
    if (card.isLinkedCard()) {
      file.boardId = Cards.findOne(card.linkedId).boardId;
      file.cardId = card.linkedId;
    } else {
      file.boardId = card.boardId;
      file.swimlaneId = card.swimlaneId;
      file.listId = card.listId;
      file.cardId = card._id;
    }
    file.userId = Meteor.userId();
    if (file.original) {
      file.original.name = fileObj.name;
    }
    return next(Attachments.insert(file));
  },
  shrinkImage(options) {
    // shrink image to certain size
    const dataurl = options.dataurl,
      callback = options.callback,
      toBlob = options.toBlob;
    let canvas = document.createElement('canvas'),
      image = document.createElement('img');
    const maxSize = options.maxSize || 1024;
    const ratio = options.ratio || 1.0;
    const next = function(result) {
      image = null;
      canvas = null;
      if (typeof callback === 'function') {
        callback(result);
      }
    };
    image.onload = function() {
      let width = this.width,
        height = this.height;
      let changed = false;
      if (width > height) {
        if (width > maxSize) {
          height *= maxSize / width;
          width = maxSize;
          changed = true;
        }
      } else if (height > maxSize) {
        width *= maxSize / height;
        height = maxSize;
        changed = true;
      }
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(this, 0, 0, width, height);
      if (changed === true) {
        const type = 'image/jpeg';
        if (toBlob) {
          canvas.toBlob(next, type, ratio);
        } else {
          next(canvas.toDataURL(type, ratio));
        }
      } else {
        next(changed);
      }
    };
    image.onerror = function() {
      next(false);
    };
    image.src = dataurl;
  },
  capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  },

  windowResizeDep: new Tracker.Dependency(),

  // in fact, what we really care is screen size
  // large mobile device like iPad or android Pad has a big screen, it should also behave like a desktop
  // in a small window (even on desktop), Wekan run in compact mode.
  // we can easily debug with a small window of desktop browser. :-)
  isMiniScreen() {
    // OLD WINDOW WIDTH DETECTION:
    this.windowResizeDep.depend();
    return $(window).width() <= 800;

    // NEW TOUCH DEVICE DETECTION:
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Browser_detection_using_the_user_agent

    /*
    var hasTouchScreen = false;
    if ("maxTouchPoints" in navigator) {
        hasTouchScreen = navigator.maxTouchPoints > 0;
    } else if ("msMaxTouchPoints" in navigator) {
        hasTouchScreen = navigator.msMaxTouchPoints > 0;
    } else {
        var mQ = window.matchMedia && matchMedia("(pointer:coarse)");
        if (mQ && mQ.media === "(pointer:coarse)") {
            hasTouchScreen = !!mQ.matches;
        } else if ('orientation' in window) {
            hasTouchScreen = true; // deprecated, but good fallback
        } else {
            // Only as a last resort, fall back to user agent sniffing
            var UA = navigator.userAgent;
            hasTouchScreen = (
                /\b(BlackBerry|webOS|iPhone|IEMobile)\b/i.test(UA) ||
                /\b(Android|Windows Phone|iPad|iPod)\b/i.test(UA)
            );
        }
    }
    */
    //if (hasTouchScreen)
    //    document.getElementById("exampleButton").style.padding="1em";
    //return false;
  },

  // returns if desktop drag handles are enabled
  isShowDesktopDragHandles() {
    const currentUser = Meteor.user();
    if (currentUser) {
      return (currentUser.profile || {}).showDesktopDragHandles;
    } else {
      return false;
    }
  },

  // returns if mini screen or desktop drag handles
  isMiniScreenOrShowDesktopDragHandles() {
    return this.isMiniScreen() || this.isShowDesktopDragHandles();
  },

  calculateIndexData(prevData, nextData, nItems = 1) {
    let base, increment;
    // If we drop the card to an empty column
    if (!prevData && !nextData) {
      base = 0;
      increment = 1;
      // If we drop the card in the first position
    } else if (!prevData) {
      base = nextData.sort - 1;
      increment = -1;
      // If we drop the card in the last position
    } else if (!nextData) {
      base = prevData.sort + 1;
      increment = 1;
    }
    // In the general case take the average of the previous and next element
    // sort indexes.
    else {
      const prevSortIndex = prevData.sort;
      const nextSortIndex = nextData.sort;
      increment = (nextSortIndex - prevSortIndex) / (nItems + 1);
      base = prevSortIndex + increment;
    }
    // XXX Return a generator that yield values instead of a base with a
    // increment number.
    return {
      base,
      increment,
    };
  },

  // Determine the new sort index
  calculateIndex(prevCardDomElement, nextCardDomElement, nCards = 1) {
    let base, increment;
    // If we drop the card to an empty column
    if (!prevCardDomElement && !nextCardDomElement) {
      base = 0;
      increment = 1;
      // If we drop the card in the first position
    } else if (!prevCardDomElement) {
      base = Blaze.getData(nextCardDomElement).sort - 1;
      increment = -1;
      // If we drop the card in the last position
    } else if (!nextCardDomElement) {
      base = Blaze.getData(prevCardDomElement).sort + 1;
      increment = 1;
    }
    // In the general case take the average of the previous and next element
    // sort indexes.
    else {
      const prevSortIndex = Blaze.getData(prevCardDomElement).sort;
      const nextSortIndex = Blaze.getData(nextCardDomElement).sort;
      increment = (nextSortIndex - prevSortIndex) / (nCards + 1);
      base = prevSortIndex + increment;
    }
    // XXX Return a generator that yield values instead of a base with a
    // increment number.
    return {
      base,
      increment,
    };
  },

  // Detect touch device
  isTouchDevice() {
    const isTouchable = (() => {
      const prefixes = ' -webkit- -moz- -o- -ms- '.split(' ');
      const mq = function(query) {
        return window.matchMedia(query).matches;
      };

      if (
        'ontouchstart' in window ||
        (window.DocumentTouch && document instanceof window.DocumentTouch)
      ) {
        return true;
      }

      // include the 'heartz' as a way to have a non matching MQ to help terminate the join
      // https://git.io/vznFH
      const query = [
        '(',
        prefixes.join('touch-enabled),('),
        'heartz',
        ')',
      ].join('');
      return mq(query);
    })();
    Utils.isTouchDevice = () => isTouchable;
    return isTouchable;
  },

  calculateTouchDistance(touchA, touchB) {
    return Math.sqrt(
      Math.pow(touchA.screenX - touchB.screenX, 2) +
        Math.pow(touchA.screenY - touchB.screenY, 2),
    );
  },

  enableClickOnTouch(selector) {
    let touchStart = null;
    let lastTouch = null;

    $(document).on('touchstart', selector, function(e) {
      touchStart = e.originalEvent.touches[0];
    });
    $(document).on('touchmove', selector, function(e) {
      const touches = e.originalEvent.touches;
      lastTouch = touches[touches.length - 1];
    });
    $(document).on('touchend', selector, function(e) {
      if (
        touchStart &&
        lastTouch &&
        Utils.calculateTouchDistance(touchStart, lastTouch) <= 20
      ) {
        e.preventDefault();
        const clickEvent = document.createEvent('MouseEvents');
        clickEvent.initEvent('click', true, true);
        e.target.dispatchEvent(clickEvent);
      }
    });
  },

  manageCustomUI() {
    Meteor.call('getCustomUI', (err, data) => {
      if (err && err.error[0] === 'var-not-exist') {
        Session.set('customUI', false); // siteId || address server not defined
      }
      if (!err) {
        Utils.setCustomUI(data);
      }
    });
  },

  setCustomUI(data) {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    if (currentBoard) {
      DocHead.setTitle(`${currentBoard.title} - ${data.productName}`);
    } else {
      DocHead.setTitle(`${data.productName}`);
    }
  },

  setMatomo(data) {
    window._paq = window._paq || [];
    window._paq.push(['setDoNotTrack', data.doNotTrack]);
    if (data.withUserName) {
      window._paq.push(['setUserId', Meteor.user().username]);
    }
    window._paq.push(['trackPageView']);
    window._paq.push(['enableLinkTracking']);

    (function() {
      window._paq.push(['setTrackerUrl', `${data.address}piwik.php`]);
      window._paq.push(['setSiteId', data.siteId]);

      const script = document.createElement('script');
      Object.assign(script, {
        id: 'scriptMatomo',
        type: 'text/javascript',
        async: 'true',
        defer: 'true',
        src: `${data.address}piwik.js`,
      });

      const s = document.getElementsByTagName('script')[0];
      s.parentNode.insertBefore(script, s);
    })();

    Session.set('matomo', true);
  },

  manageMatomo() {
    const matomo = Session.get('matomo');
    if (matomo === undefined) {
      Meteor.call('getMatomoConf', (err, data) => {
        if (err && err.error[0] === 'var-not-exist') {
          Session.set('matomo', false); // siteId || address server not defined
        }
        if (!err) {
          Utils.setMatomo(data);
        }
      });
    } else if (matomo) {
      window._paq.push(['trackPageView']);
    }
  },

  getTriggerActionDesc(event, tempInstance) {
    const jqueryEl = tempInstance.$(event.currentTarget.parentNode);
    const triggerEls = jqueryEl.find('.trigger-content').children();
    let finalString = '';
    for (let i = 0; i < triggerEls.length; i++) {
      const element = tempInstance.$(triggerEls[i]);
      if (element.hasClass('trigger-text')) {
        finalString += element.text().toLowerCase();
      } else if (element.hasClass('user-details')) {
        let username = element.find('input').val();
        if (username === undefined || username === '') {
          username = '*';
        }
        finalString += `${element
          .find('.trigger-text')
          .text()
          .toLowerCase()} ${username}`;
      } else if (element.find('select').length > 0) {
        finalString += element
          .find('select option:selected')
          .text()
          .toLowerCase();
      } else if (element.find('input').length > 0) {
        let inputvalue = element.find('input').val();
        if (inputvalue === undefined || inputvalue === '') {
          inputvalue = '*';
        }
        finalString += inputvalue;
      }
      // Add space
      if (i !== length - 1) {
        finalString += ' ';
      }
    }
    return finalString;
  },
};

// A simple tracker dependency that we invalidate every time the window is
// resized. This is used to reactively re-calculate the popup position in case
// of a window resize. This is the equivalent of a "Signal" in some other
// programming environments (eg, elm).
$(window).on('resize', () => Utils.windowResizeDep.changed());
