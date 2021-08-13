// PROVIDED CODE BELOW (LINES 1 - 80) DO NOT REMOVE

// The store will hold all information needed globally

const store = {
  track_id: undefined,
  player_id: undefined,
  race_id: undefined
}

let raceInterval = null
let countInterval = null

// We need our javascript to wait until the DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
  onPageLoad()
  setupClickHandlers()
})

async function onPageLoad () {
  try {
    getTracks()
      .then(tracks => {
        if (tracks.error) {
          renderAt('#race', renderServerError(tracks))
          return
        }
        const html = renderTrackCards(tracks)
        renderAt('#tracks', html)
      })

    getRacers()
      .then((racers) => {
        if (racers.error) {
          renderAt('#race', renderServerError(racers))
          return
        }
        const html = renderRacerCars(racers)
        renderAt('#racers', html)
      })
  } catch (error) {
    console.log('Problem getting tracks and racers ::', error.message)
    console.error(error)
  }
}

function setupClickHandlers () {
  document.addEventListener('click', function (event) {
    const { target } = event

    // Race track form field
    if (target.parentNode.matches('.card.track')) {
      handleSelectTrack(target.parentNode)
    }

    // Podracer form field
    if (target.parentNode.matches('.card.podracer')) {
      handleSelectPodRacer(target.parentNode)
    }

    // Submit create race form
    if (target.matches('#submit-create-race')) {
      event.preventDefault()

      // start race
      handleCreateRace()
    }

    // Handle acceleration click
    if (target.matches('#gas-peddle')) {
      handleAccelerate(target)
    }
  }, false)
}

async function delay (ms) {
  try {
    return await new Promise(resolve => setTimeout(resolve, ms))
  } catch (error) {
    console.log("an error shouldn't be possible here")
    console.log(error)
  }
}
// ^ PROVIDED CODE ^ DO NOT REMOVE

// This async function controls the flow of the race, add the logic and error handling
async function handleCreateRace () {
  const playerId = store.player_id
  const trackId = store.track_id
  if (!playerId || !trackId || !store.race_id) {
    renderAt('#error', '<h2 class="error">Please select Track and Race</h2>')
    return
  }
  try {
    const race = await createRace(playerId, trackId)
    // update the store with the race id
    store.race_id = race.ID

    // render starting UI
    renderAt('#race', renderRaceStartView(race.Track, race.Cars))
  } catch (error) {
    renderAt('#error', `<h2 class="error">${error.message}</h2>`)
    console.log(error)
    return
  }

  // The race has been created, now start the countdown
  // call the async function runCountdown
  await runCountdown()

  // call the async function startRace
  const startResults = await startRace(store.race_id - 1)

  if (startResults.error) {
    renderAt('#race', renderServerError(startResults))
    return
  }

  // call the async function runRace
  runRace(store.race_id - 1)
}

function runRace (raceID) {
  return new Promise(resolve => {
    // use Javascript's built in setInterval method to get race info every 500ms
    raceInterval = setInterval(() => {
      getRace(raceID).then((res) => {
        if (res.status === 'in-progress') {
          // if the race info status property is "in-progress", update the leaderboard by calling:
          renderAt('#leaderBoard', raceProgress(res.positions))
        }

        if (res.status === 'finished') {
          //  if the race info status property is "finished", run the following:
          clearInterval(raceInterval) // to stop the interval from repeating
          renderAt('#race', resultsView(res.positions)) // to render the results view
          resolve(res) // resolve the promise
        }
      })
    }, 500)
  })
}

async function runCountdown () {
  try {
    // wait for the DOM to load
    await delay(1000)
    let timer = 3

    return new Promise(resolve => {
      // count down once per second
      countInterval = setInterval(() => {
        // run this DOM manipulation to decrement the countdown for the user
        document.getElementById('big-numbers').innerHTML = --timer
        // if the countdown is done, clear the interval, resolve the promise, and return
        if (timer === 0) {
          clearInterval(countInterval)
          resolve()
        }
      }, 1000)
    })
  } catch (error) {
    console.log(error)
  }
}

function handleSelectPodRacer (target) {
  console.log('selected a pod', target.id)

  // remove class selected from all racer options
  const selected = document.querySelector('#racers .selected')
  if (selected) {
    selected.classList.remove('selected')
  }

  // add class selected to current target
  target.classList.add('selected')

  store.race_id = target.id
}

function handleSelectTrack (target) {
  console.log('selected a track', target.id)

  // remove class selected from all track options
  const selected = document.querySelector('#tracks .selected')
  if (selected) {
    selected.classList.remove('selected')
  }

  // add class selected to current target
  target.classList.add('selected')

  store.track_id = +target.id
  store.player_id = +target.id
}

function handleAccelerate () {
  console.log('accelerate button clicked')
  // Invoke the API call to accelerate
  accelerate(store.race_id - 1)
}

// HTML VIEWS ------------------------------------------------
function renderServerError (error) {
  return `
        <header class="down">
            <h1>Server is down!</h1>
        </header>
        <main>
            <section>
                ${error.message}
            </section>
            <section>
                <a class="button center" href="/">Back to Home Page</a>
            </section>
        </main>
    `
}

function renderError (error) {
  return `
        <header class="down">
            <h1>An Error Occured!</h1>
        </header>
        <main>
            <section>
                ${error.message}
            </section>
            <section>
                <a class="button center" href="/">Back to Home Page</a>
            </section>
        </main>
    `
}

// Provided code - do not remove

function renderRacerCars (racers) {
  if (!racers.length) {
    return `
        <h4>Loading Racers...</4>
    `
  }

  const results = racers.map(renderRacerCard).join('')

  return `
        <ul id="racers">
            ${results}
        </ul>
    `
}

function renderRacerCard (racer) {
  const { id, driver_name: driverName, top_speed: topSpeed, acceleration, handling } = racer

  return `
        <li class="card podracer" id="${id}">
            <h3>${driverName}</h3>
            <p>${topSpeed}</p>
            <p>${acceleration}</p>
            <p>${handling}</p>
        </li>
    `
}

function renderTrackCards (tracks) {
  if (!tracks.length) {
    return `
        <h4>Loading Tracks...</4>
    `
  }

  const results = tracks.map(renderTrackCard).join('')

  return `
    <ul id="tracks">
        ${results}
    </ul>
    `
}

function renderTrackCard (track) {
  const { id, name } = track

  return `
    <li id="${id}" class="card track">
        <h3>${name}</h3>
    </li>
`
}

function renderCountdown (count) {
  return `
        <h2>Race Starts In...</h2>
        <p id="big-numbers">${count}</p>
    `
}

function renderRaceStartView (track, racers) {
  return `
        <header>
            <h1>Race: ${track.name}</h1>
        </header>
        <main id="two-columns">
            <section id="leaderBoard">
                ${renderCountdown(3)}
            </section>

            <section id="accelerate">
                <h2>Directions</h2>
                <p>Click the button as fast as you can to make your racer go faster!</p>
                <button id="gas-peddle">Click Me To Win!</button>
            </section>
        </main>
        <footer></footer>
    `
}

function resultsView (positions) {
  positions.sort((a, b) => (a.final_position > b.final_position) ? 1 : -1)

  return `
        <header>
            <h1>Race Results</h1>
            </header>
        <main>
            ${raceProgress(positions)}
            <a href="/race">Start a new race</a>
        </main>
    `
}

function raceProgress (positions) {
  const userPlayer = positions.find(e => e.id === store.player_id)
  if (!userPlayer) {
    clearInterval(countInterval)
    clearInterval(raceInterval)
    renderAt('#race', renderError({ message: 'player not found!' }))
    return
  }
  userPlayer.driver_name += ' (you)'

  positions = positions.sort((a, b) => (a.segment > b.segment) ? -1 : 1)
  let count = 1

  const results = positions.map(p => {
    return `
            <tr>
                <td>
                    <h3>${count++} - ${p.driver_name}</h3>
                </td>
            </tr>
        `
  })

  return `
        <main>
            <h3>Leaderboard</h3>
            <section id="leaderBoard">
                ${results.join('')}
            </section>
        </main>
    `
}

function renderAt (element, html) {
  const node = document.querySelector(element)
  if (node) {
    node.innerHTML = html
  }
}

// ^ Provided code ^ do not remove

const SERVER = 'http://localhost:8000'

// API CALLS ------------------------------------------------

function defaultFetchOpts () {
  return {
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': SERVER
    }
  }
}

function getTracks () {
  // GET request to `${SERVER}/api/tracks`
  return fetch(`${SERVER}/api/tracks`)
    .then(resp => resp.json())
    .catch(err => ({ error: true, message: err.message }))
}

function getRacers () {
  // GET request to `${SERVER}/api/cars`
  return fetch(`${SERVER}/api/cars`)
    .then(resp => resp.json())
    .catch(err => ({ error: true, message: err.message }))
}

function createRace (playerId, trackId) {
  playerId = parseInt(playerId)
  trackId = parseInt(trackId)
  const body = { playerId, trackId }

  return fetch(`${SERVER}/api/races`, {
    method: 'POST',
    ...defaultFetchOpts(),
    dataType: 'jsonp',
    body: JSON.stringify(body)
  })
    .then(res => res.json())
    .catch(err => console.log('Problem with createRace request::', err))
}

function getRace (id) {
  // GET request to `${SERVER}/api/races/${id}`
  return fetch(`${SERVER}/api/races/${id}`)
    .then(res => res.json())
    .catch(err => console.log(err.message))
}

function startRace (id) {
  return fetch(`${SERVER}/api/races/${id}/start`, {
    method: 'POST',
    ...defaultFetchOpts()
  })
    .catch(err => ({ error: true, message: err.message }))
}

function accelerate (id) {
  // POST request to `${SERVER}/api/races/${id}/accelerate`
  // options parameter provided as defaultFetchOpts
  // no body or datatype needed for this request
  return fetch(`${SERVER}/api/races/${id}/accelerate`, {
    method: 'POST'
  })
    .catch(err => console.log('Problem with createRace request::', err))
}
