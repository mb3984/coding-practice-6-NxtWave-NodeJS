const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const databasePath = path.join(__dirname, 'covid19India.db')
const app = express()
app.use(express.json())
let database = null

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is running at http://localhost:3000/')
    })
  } catch (error) {
    console.log(`DB ERROR:${error.message}`)
    process.exit(1)
  }
}

initializeDbAndServer()

const convertStateDbObjectToResponseObject = dbObject => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  }
}

const convertDistrictDbObjectToResponseObject = dbObject => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  }
}

//API1
app.get('/states/', async (request, response) => {
  const getStatesQuery = `
    SELECT * FROM state`
  const statesArray = await database.all(getStatesQuery)
  response.send(
    statesArray.map(eachState =>
      convertStateDbObjectToResponseObject(eachState),
    ),
  )
  console.log(
    statesArray.map(eachState =>
      convertStateDbObjectToResponseObject(eachState),
    ),
  )
})

//API2
app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getStateQuery = `
  SELECT * FROM state WHERE state_id=${stateId}`
  const state = await database.get(getStateQuery)
  response.send(convertStateDbObjectToResponseObject(state))
  console.log(state)
})

//API3
app.post('/districts/', async (request, response) => {
  const {stateId, districtName, cases, cured, active, deaths} = request.body
  const postDistrictQuery = `
  INSERT INTO district(state_id,district_name,cases,cured,active,deaths)
  VALUES(${stateId},"${districtName}",${cases},${cured},${active},${deaths})
  `
  await database.run(postDistrictQuery)
  response.send('District Successfully Added')
  console.log('District Successfully Added')
})

//API4
app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictQuery = `
  SELECT * FROM district WHERE district_id=${districtId}`
  const district = await database.get(getDistrictQuery)
  response.send(convertDistrictDbObjectToResponseObject(district))
  console.log(district)
})

//API5
app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deleteDistrictQuery = `
  DELETE FROM district WHERE district_id=${districtId}`
  await database.run(deleteDistrictQuery)
  response.send('District Removed')
  console.log('District Removed')
})

//API6
app.put('/districts/:districtId/', async (request, response) => {
  const {stateId, districtName, cases, cured, active, deaths} = request.body
  const {districtId} = request.params
  const updateDistrictQuery = `
  UPDATE district SET state_id=${stateId},district_name="${districtName}",cases=${cases},cured=${cured},
  active=${active},deaths=${deaths}
  WHERE district_id=${districtId}`
  await database.run(updateDistrictQuery)
  response.send('District Details Updated')
  console.log('District Details Updated')
})

//API7
app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const getStateStatsQuery = `
  SELECT SUM(cases),SUM(cured),SUM(active),SUM(deaths)
  FROM district WHERE state_id=${stateId}`
  const stats = await database.get(getStateStatsQuery)
  response.send({
    totalCases: stats['SUM(cases)'],
    totalCured: stats['SUM(cured)'],
    totalActive: stats['SUM(active)'],
    totalDeaths: stats['SUM(deaths)'],
  })
})

//API8
app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const getStateNameQuery = `
  SELECT state_name FROM district NATURAL JOIN state WHERE district_id=${districtId}`
  const state = await database.get(getStateNameQuery)
  response.send({stateName: state.state_name})
  console.log({stateName: state.state_name})
})

module.exports = app
