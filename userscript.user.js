// ==UserScript==
// @name        Last.fm Library Tracks to Playlist Helper
// @namespace   https://github.com/jjnilton/lastfm-library-tracks-to-playlist-helper
// @icon        data:image/x-icon;base64,AAABAAIAAAAAAAEAIAClAQAAJgAAAAAAAAABACAAeAMAAMsBAACJUE5HDQoaCgAAAA1JSERSAAAAEAAAABAIBgAAAB/z/2EAAAFsSURBVDhPzZM/SEJBGMB/L0gJAkl8GUlUJAhBONkfHFqEQpyEIHAKnJxcfIuDi5EEguDUJDQKDUFEBi02BL3aJFMKBM2MQiIKQ9AX74YHjjr1g4O7j/t+333HnXQJmxocAqsMx60EilSAV2DGCA9HSxdoxnIE/pnAFgiwmEgw6XbzUy7zpCi0CwXsu7vMKwomu5321RWP4TD9bnewhXFZZqNSoba/Tz2TYSEeZy4a5cblwqOq1JJJPs7OWDo4EPPO8/OgwLq1xcrJCUWLBa3XY8xkYr1apZHNipOZHQ7e8nmaR0f81usiWccQ6JuWj4+5lmUh0NGrWX0+7r1epnd2xJjy+bjzeESLAwLz7KyoWE+naeZy2Px+vksl3OfnRlsmm421cpmHUIj309NBgY4cDOJMpcRlfakqlUiECaeT+VgMi9cr+v4sFqlGo/Q7HZHzz97BKEiX0NDAYUSGQIIX6QK2JciN8CNbGuz9AfUIkeh5y/IPAAAAAElFTkSuQmCCiVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAADP0lEQVRYR+2Xb0iTURTGn9elJM6Ws4VlqTUqluZA0MypIIiCIBom6EdBEITBcOgnQQRBEIRgIAiCIAiiYIqg6EeVkgxxMJBN/DtnykhM57+ZLs5x79u016gPzj74+3R37tl9n/ucey5cAQA+ArG7QKsAZPqAWIpdFQLg8gGTkYA5A3AJI8CLENYAtZQVHLZOgCxhDOjzAe+C883zCMAHErDtA1RSNIgIgEcYBXxB/OZv3Ai4ceD/diAsJgZxNTW4m52NyJQUHDqdOHa74e7vx3pHB463tqTTTNxJTcVjkwkRSUmI0OmwZ7Nh12rFSnMz9h0OKS+QSx2gxZKHhhCqlr8gSchsQQE8Viv/jsrJ4fyQsDB/xi8o94vBgMPlZSkmIiuAFnlts+F2QgJODw5gr67Gt5ERKCIioCkpwdOmJs45WFjAZ70ep14vUqenodTrWZCtrAxHTifUeXlI6uuDoFCwC4sNDdI3RGQF3C8tRWJ3N48X6+ux0tLinzkjzmyGtrmZxySOypHlduOWSgVXezscRqM/82ytHzs72Lfb/96B5xYLYquqeGcTGg27EEhIeDgylpa4PN+npjCTnY20mRmu/YnHwzvdGh29tO6ByApIHhhAdEEBWzyl00nxQESRxCetlg9pYk8P2y3CB3ZwEMtNTThaX5figcgK0A8PQ52bi725Oa6xHOr8fOiHhng8bzZjzWLhgxtbXY3ovDyEajT+THC3kEtyjsgKoPpT7ch6LoHXK82J0E4NLheXQU4otSG15IOKCv5NAknoRWQFPDIa8ay1lcfzJhPW2tr8M2fQ4rSbJ42NiK+r45hcHiF2B50Ja2GhFBeRFUD2vbHboVAq2QWHycRtGBoVhXvFxYivrYWtvJxbLm12ll0gl6gbNrq62JFwrZaF6jo6+NDSHHXMRWQFEJqiIug6O1mEHLRb2rXKYMCr3t5zNb/IP58BEbqIqI6q9HTeDV3Fh6urfBV/7eyE7+SE88iBh5WVUGVk8PVNlns3N+Hd2MD2+DjXn/4rxx8FBIMbATcOXL8D1/4wGQP6fcDbYLTcRfhpNgy8VAAT1/Y4JSX0PPcA731AJoAYUeEVsSEAk0rARM/znw3vdFqmQzwSAAAAAElFTkSuQmCC
// @version     1.0.1
// @license     GPL-3.0-only
//
// @match       https://www.last.fm/user/*/library/tracks
// @grant       none
//
// @author      JJ (jjlist)
// @description Create a Last.fm playlist from the tracks on your library page.
// ==/UserScript==
// Last.fm Playlist Helper
// Roadmap: batch add songs from the playlist screen
(function () {
  "use strict";

  const [, , username] = new URL(location.href).pathname.split('/');

  const LASTFM_PLAYLIST_URL = `https://www.last.fm/user/${username}/playlists`;

  // UI refs looked up once at mount time
  // document.querySelector cannot see inside a shadow root
  const ui = {};

  // true while a run is going
  // reopening the dialog must keep its state
  let running = false;

  // page CSS cannot reach the shadow root so we copy last.fm values
  // font and color from <body> still cross the boundary
  const DIALOG_CSS = /* css */`
    dialog {
      /* centering and ::backdrop come from the browser */
      padding: 1.5em;
      min-width: 24em;
      max-width: min(90vw, 40em);
      background: #fff;
      border: 1px solid #eee;
      border-radius: 3px;
      box-shadow: 0 3px 9px 0 rgba(0, 0, 0, .2);
    }
    .title {
      /* last.fm's .content-form legend */
      font-size: 18px;
      font-weight: 700;
      line-height: 24px;
      margin-bottom: 0.5em;
    }
    /* muted line under the title */
    .description {
      color: #666;
      font-size: 13px;
      line-height: 18px;
      margin: 0 0 0.75em;
    }
    input[type="text"] {
      width: 100%;
      box-sizing: border-box;
      height: 40px;
      padding: 6px 12px;
      margin: 0.5em 0;
      background: #fff;
      border: 2px solid #eee;
      border-radius: 3px;
      color: #222;
      font: inherit;
    }
    input[type="text"]::placeholder { color: #999; }
    input[type="text"]:hover { border-color: #e3e3e3; }
    input[type="text"]:focus {
      border-color: #e3e3e3;
      box-shadow: 0 3px 9px 0 #eee;
      outline: none;
    }
    /* start and checkbox share one row */
    .preserve-order-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    /* muted hint under the checkbox */
    .preserve-order-info {
      color: #666;
      font-size: 12px;
      margin-top: 2px;
    }
    button {
      /* keep last.fm's font across the boundary */
      font: inherit;
      cursor: pointer;
    }
    /* last.fm's .btn-primary and .btn-secondary */
    .btn-primary,
    .btn-secondary {
      border: none;
      border-radius: 3px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: .4px;
      min-height: 40px;
      min-width: 80px;
      text-align: center;
      text-transform: uppercase;
    }
    .btn-primary {
      background: #d92323;
      color: #fff;
      line-height: 21px;
      padding: 9px 20px 10px;
    }
    .btn-primary:hover { background: #f71414; }
    /* disabled controls must not look clickable */
    .btn-primary:disabled {
      background: #eee;
      color: #999;
      cursor: not-allowed;
    }
    .btn-secondary {
      background: #eee;
      color: #222;
      line-height: 28px;
      padding: 5px 15px 6px;
    }
    .btn-secondary:hover { background: #e3e3e3; }
    .btn-secondary:active { background: #d7d7d7; }
    /* last.fm link style */
    a { color: #005399; text-decoration: none; }
    a:hover, a:focus { text-decoration: underline; }
    /* last.fm success alert */
    .alert { margin-top: 24px; }
    .alert-success {
      background-color: #e5f4ef;
      color: #096;
      padding: 10px 15px 10px 46px;
      position: relative;
      text-align: left;
    }
    .alert-success::before {
      content: "";
      position: absolute;
      left: 15px;
      top: 50%;
      width: 16px;
      height: 16px;
      margin-top: -8px;
      background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Ccircle cx='8' cy='8' r='7' fill='none' stroke='%23096' stroke-width='2'/%3E%3Cpath d='M4.5 8.5 7 11l4.5-5.5' fill='none' stroke='%23096' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") no-repeat 0 0 / 16px 16px;
    }
    /* scoped so the trigger button in the list keeps its place */
    dialog .btn-primary,
    dialog .btn-secondary { margin: 0.5em 0; }
    progress { width: 100%; }
  `;

  // check for the Invoker Commands API
  const SUPPORTS_INVOKERS = 'commandForElement' in HTMLButtonElement.prototype;

  // span accepts a shadow root but li does not
  // one root holds button and dialog so commandfor can resolve
  const mount = (host) => host.attachShadow({ mode: 'open' });

  // Add markup without changing what is already there
  // innerHTML += would recreate the button
  const appendToRoot = (root, html) => {
    const tpl = document.createElement('template');
    tpl.innerHTML = html;
    root.appendChild(tpl.content);
  };

  // query inside the shadow root where document cannot reach
  const $ = (sel) => ui.root.querySelector(sel);

  // our <li> if mounted else null
  // last.fm's own <li>s have no shadow root so they never match
  const findMountedLi = () =>
    Array.from(document.querySelectorAll('ul.metadata-list > li'))
      .find((li) => Array.from(li.children)
        .some((child) => child.shadowRoot?.querySelector('.create-playlist')))
      ?? null;

  // last.fm re-parses the list and kills shadow roots
  // our old <li> survives empty so match it by shape
  const removeLeftovers = (list) => {
    Array.from(list.children).filter((li) =>
      li.className === 'metadata-item' &&
      li.children.length === 1 &&
      li.firstElementChild.localName === 'span' &&
      li.firstElementChild.attributes.length === 0 &&
      !li.firstElementChild.shadowRoot &&
      li.textContent === ''
    ).forEach((leftover) => leftover.remove());
  };

  function main() {
    // main() can run twice and each run adds a button
    // check the DOM because a second run has its own empty `ui`
    if (findMountedLi()) return;

    mountUI();
    startWatcher();
  }

  // put the UI on the page
  // appendButton() must run first to create the root
  const mountUI = () => {
    const tracks = getTracksFromUrlList(getUrls());

    appendButton();
    appendModal(tracks);
  }

  // last.fm rebuilds the list after load and destroys the <li>
  // watch the whole document since the list itself may be replaced
  const startWatcher = () => {
    let rebuildTimer = null;
    let waitRetries = 0;
    const MAX_WAIT_RETRIES = 30; // to give up after N polls

    const scheduleRebuild = (delay = 0) => {
      if (rebuildTimer !== null) return; // one rebuild per batch
      rebuildTimer = setTimeout(() => {
        rebuildTimer = null;
        // re-check in case the rebuild already happened
        if (findMountedLi()) { waitRetries = 0; return; }

        // no list yet (page may still be loading)
        if (!document.querySelector('ul.metadata-list')) {
          if (waitRetries < MAX_WAIT_RETRIES) {
            waitRetries += 1;
            scheduleRebuild(1000);
          }
          return;
        }

        mountUI(); // before the observer's next check
      }, delay);
    };

    new MutationObserver((records) => {
      // only a removal can destroy the userscript
      if (!records.some((r) => r.removedNodes.length > 0)) return;
      if (findMountedLi()) return;
      scheduleRebuild();
    }).observe(document.documentElement, { childList: true, subtree: true });
  };

  // all track links on the page as absolute URLs
  const getUrls = () => {
    const urlList = [];
    document.querySelectorAll(".chartlist-name > a").forEach((i) => { urlList.push(i.href) })

    return urlList;
  }

  // split "/music/Artist/_/Title" into artist and title
  const getTracksFromUrlList = (urlList) => {
    const trackList = urlList.flatMap(i => {
      const path = i.split('/music/')[1];
      const match = path?.match(/^([^/]+)\/_\/([^/]+)$/);
      if (!match) return []; // skip links that are not tracks

      const [, artist, track] = match;
      const decodedArtist = decodeURIComponent(artist).replaceAll('+', ' ');
      const decodedTrack = decodeURIComponent(track).replaceAll('+', ' ');

      return [{
        artist: decodedArtist,
        title: decodedTrack
      }]
    })

    return trackList
  }

  const createEmptyPlaylist = async () => {
    const csrfMiddlewareToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    const res = await fetch(LASTFM_PLAYLIST_URL, {
      "credentials": "include",
      "headers": {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest",
      },
      "referrer": `${LASTFM_PLAYLIST_URL}/create`, //TODO: test if this is really needed
      "body": new URLSearchParams({csrfmiddlewaretoken: csrfMiddlewareToken}),
      "method": "POST"
    });

    const PLAYLIST_CREATED = res.redirected;
    if (false === PLAYLIST_CREATED) {
      alert('Could not create a new playlist. Check if you reached the playlist amount limit in the Playlists page.');

      throw new Error('Could not create a new playlist.');
    }

    // playlist link for the success panel
    ui.playlistUrl.innerHTML = `<a href="${res.url}" target="_blank">${res.url}</a>`
    const playlistId = new URL(res.url).pathname.split('/').at(-1);

    return playlistId
  }

  // empty fields fall back to these
  // the placeholders show the same values
  const DEFAULT_NAME = 'Name of my Playlist';
  const DEFAULT_DESCRIPTION = 'Generated by Last.fm Playlist Helper';

  // same as @name for the dialog title
  const SCRIPT_NAME = 'Last.fm Library Tracks to Playlist Helper';

  const renamePlaylist = async (playlistId, playlistName, playlistDescription) => {
    const csrfMiddlewareToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    const newPlaylistName = playlistName || DEFAULT_NAME;
    const newPlaylistDescription = playlistDescription || DEFAULT_DESCRIPTION;

    const res = await fetch(`${LASTFM_PLAYLIST_URL}/${playlistId}`, {
      "credentials": "include",
      "headers": {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest",
      },
      "referrer": `${LASTFM_PLAYLIST_URL}/${playlistId}`,
      "body": new URLSearchParams(
        {
          title: newPlaylistName,
          description: newPlaylistDescription,
          ajax: 1,
          csrfmiddlewaretoken: csrfMiddlewareToken,
        }
      ),
      "method": "POST",
    });

    if (!res.ok) {
      throw new Error(`Could not rename the playlist (HTTP ${res.status}).`);
    }

    // playlist name for the success panel
    ui.playlistName.innerText = newPlaylistName
  }

  const addTrackToPlaylist = async (playlistId, trackObj) => {
    const csrfMiddlewareToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    const res = await fetch(`${LASTFM_PLAYLIST_URL}/${playlistId}/entries`, {
      "credentials": "include",
      "headers": {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest",
      },
      "referrer": `${LASTFM_PLAYLIST_URL}/${playlistId}`,
      "body": new URLSearchParams({
        csrfmiddlewaretoken: csrfMiddlewareToken,
        track: trackObj.title,
        artist: trackObj.artist, 
        ajax: 1
      }),
      "method": "POST",
    });

    // stop the run instead of counting a rejected add as success
    if (!res.ok) {
      throw new Error(`Could not add "${trackObj.artist} - ${trackObj.title}" to the playlist (HTTP ${res.status}).`);
    }
  }

  const doTheThing = async (playlistName, playlistDescription, preserveOrder) => {
    const tracks = getTracksFromUrlList(getUrls());
    ui.progress.max = tracks.length;
    ui.totalTracks.innerText = tracks.length;

    const playlistId = await createEmptyPlaylist();
    await renamePlaylist(playlistId, playlistName, playlistDescription);

    let processedTracks = 0;
    for (const track of tracks) {
      await addTrackToPlaylist(playlistId, track)
      if (preserveOrder) { // TODO: progress is messed up when false
        await new Promise(resolve => setTimeout(resolve, 100)) 
      }
      processedTracks += 1;

      ui.processed.innerText = processedTracks                       // "(N/total)"
      ui.progress.value = processedTracks                            // progress bar
      ui.progressValue.innerText = (processedTracks * 100)/tracks.length // percent
      ui.currentTrack.innerText = `${track.artist} - ${track.title}`.replaceAll('+', ' ')
    }

    // show the success panel
    ui.form.reset()
    ui.panelForm.hidden = true     // hide the form
    ui.panelSuccess.hidden = false // show the success panel
    ui.currentTrack.innerText = 'Completed.'
  }

  // reset the dialog on every open
  const resetDialogState = () => {
    // a run owns the panel so reopening must not reset it
    if (running) return;
    ui.panelForm.hidden = false     // show the form
    ui.panelSuccess.hidden = true   // hide the success panel
    ui.currentTrack.innerText = 'Ready to process tracks.'
    ui.progress.value = 0
    ui.progressValue.innerText = '0'
    ui.processed.innerText = '0'
    ui.form.querySelectorAll('button, input').forEach(e => {
      e.disabled = false;
    })
  };

  const appendButton = () => {
    // the <li> stays in last.fm's light DOM for .metadata-item styling
    // everything we build goes in the shadow root below
    const li = document.createElement('li');
    li.className = 'metadata-item';

    // last.fm floats .metadata-item left and that moved our element
    // float right keeps our x stable
    li.style.float = 'right';

    // attachShadow() only allows some tags like <span>
    const host = document.createElement('span');

    // one root for button and dialog so commandfor can resolve
    ui.root = mount(host);

    // style and trigger button
    // appendToRoot() keeps raw CSS from becoming text
    appendToRoot(ui.root, `
      <style>${DIALOG_CSS}</style>
      <button class="create-playlist btn-primary"
              commandfor="dialog"
              command="show-modal">Create playlist</button>
    `);

    li.appendChild(host);
    const metadataList = document.querySelector('ul.metadata-list');
    // clear leftovers from an earlier render
    removeLeftovers(metadataList);
    metadataList.appendChild(li);

    // older browsers open the dialog manually
    // only one path may run or showModal() throws
    if (!SUPPORTS_INVOKERS) {
      ui.root.querySelector('.create-playlist').addEventListener('click', () => {
        resetDialogState();
        ui.dialog.showModal();
      });
    }
  };

  const appendModal = (trackList) => {
    const dialogElement = /* HTML */`
<dialog id="dialog">
    <div class="form-panel">
    <div class="title">${SCRIPT_NAME}</div>
    <p class="description">Creates a new last.fm playlist from the tracks listed on this page.</p>
    <form id="create-playlist-form">
      <label style="display: block" for="playlist-name">
        Playlist name
      </label>
      <input style="display: block" type="text" name="playlist-name" placeholder="${DEFAULT_NAME}" />
      <label style="display: block" for="playlist-description">
        Playlist description
      </label>
      <input style="display: block" type="text" name="playlist-description" placeholder="${DEFAULT_DESCRIPTION}" />
      <div class="preserve-order-row">
        <button id="confirm-create-playlist" class="btn-primary">
          Start
        </button>
        <div>
          <input id="preserve-order" name="preserve-order" type="checkbox" checked />
          <label for="preserve-order">Preserve order</label>
          <div class="preserve-order-info">Slower to process when checked.</div>
        </div>
      </div>
      <label style="display: block">
    <span class="current-track"></span>
    </label>
    <div style="display:flex; gap: 0.5em">
      <progress max="${trackList.length}" value="0"></progress>
      <span><span class="progress-value">0</span>%</span>
      <span>(<span class="processed-tracks">0</span>/<span class="total-tracks">${trackList.length}</span>)</span>
      </div>
    </form>
  </div>
      <div class="success-panel" hidden>
      <div class="title">${SCRIPT_NAME}</div>
      <div class="alert alert-success">
        Success! Playlist <strong><span class="playlist-name"></span></strong> created.
      </div>
      <p>You can access your playlist in the URL below:</p>
      <p><span class="playlist-url"></span></p>
      </div>
  <button type="button" class="btn-secondary" commandFor="dialog" command="close">
    Close
  </button>
</dialog>
`
    // same shadow root as the button so commandfor can resolve
    // use a template fragment since innerHTML += would rebuild the root
    appendToRoot(ui.root, dialogElement);

    // our elements by the markup they came from
    ui.dialog        = $('#dialog')
    ui.form          = $('#create-playlist-form')
    ui.panelForm     = $('.form-panel')
    ui.panelSuccess  = $('.success-panel')
    ui.currentTrack  = $('.current-track')
    ui.progress      = $('#create-playlist-form progress')
    ui.progressValue = $('.progress-value')
    ui.processed     = $('.processed-tracks')
    ui.totalTracks   = $('.total-tracks')
    ui.playlistName  = $('.playlist-name')
    ui.playlistUrl   = $('.playlist-url')

    // `command` fires just before the dialog opens
    // the fallback path resets from the button
    ui.dialog.addEventListener('command', (event) => {
      if (event.command !== 'show-modal') return;
      resetDialogState();
    });

    // close button for older browsers
    if (!SUPPORTS_INVOKERS) {
      ui.dialog.querySelector('button[command="close"]')
        .addEventListener('click', () => ui.dialog.close());
    }

    // use `submit` not `click` so Enter works too
    // a click reaches document retargeted to the host
    ui.form.addEventListener('submit', (event) => {
      event.preventDefault(); // stop the page reloading

      const formData = new FormData(ui.form)

      const playlistName = formData.get('playlist-name');
      const playlistDescription = formData.get('playlist-description');

      const preserveOrder = formData.has('preserve-order');

      running = true;
      ui.currentTrack.innerText = 'Starting...'
      ui.form.querySelectorAll('button, input').forEach(e => {
        e.disabled = true;
      })
      doTheThing(playlistName, playlistDescription, preserveOrder)
        .catch(() => {
          // failed before the end so reset for a retry
          running = false;
          resetDialogState();
        })
        .finally(() => {
          running = false;
        });
    })

    // a rebuild mid-run must keep controls disabled
    if (running) {
      ui.form.querySelectorAll('button, input').forEach(e => {
        e.disabled = true;
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
  } else {
    main();
  }
})();
