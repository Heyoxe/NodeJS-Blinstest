//Setting up const
console.log('Initializing variables...')
const express = require('express')
const btoa = require('btoa')
const atob = require('atob')
const fs = require('fs')
const mongodbURL = fs.readFileSync(`${__dirname}/mongodb.txt`, 'utf8')

console.log('Initializing Server and Network Listner...')
const app = express()
const server = require('http').createServer(app)

const ip = require("ip")
const port = 5000

const io = require('socket.io').listen(server)
server.listen(port)

console.log(`Server Started on ${ip.address()}:${port}`)


//Routes (or whatever it's called)
console.log('Creating routes...')
app.get('/public/audio/*', function(req, res){
    let data = req.params[0].split('/')
    const file = `${__dirname}/public/audio/${atob(data[0])}/${atob(data[1])}/${atob(data[2])}.mp3`;
    res.sendFile(file, (err) => {
        if (err) {
            res.sendFile(`${__dirname}/public/error.html`)
        }
    })
})

app.get('/', function(req, res){
    const file = `${__dirname}/public/home.html`;
    res.sendFile(file, (err) => {
        if (err) {
            res.sendFile(`${__dirname}/public/error.html`)
        }
    })
})


app.get('/*', function(req, res){
    const file = `${__dirname}${req.originalUrl}`;
    res.sendFile(file, (err) => {
        if (err) {
            res.sendFile(`${__dirname}/public/error.html`)
        }
    })
});



// Connecting to the database
console.log('Connecting to the database...')
const MongoClient = require('mongodb').MongoClient;
const url = mongodbURL;
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
let allDocuments
let totalTime = 20
let infoDuration = 5
let lastElements = new Array()

function selectElement(data) {
    let result = data[Math.floor(Math.random() * data.length)]
    let selectedIndex = lastElements.indexOf(result)
    if ((selectedIndex < (data.length / 2)) && (selectedIndex > -1)) {
        result = selectElement(data)
    } else {
        if (lastElements.length == data.length) {
            lastElements.splice((lastElements.length - 1), 1)
        }
        arrayInsert(lastElements, 0, result)
        return result
    }
}

function arrayInsert(array, index, element) {
    return array.splice(index, 0, element)
}

async function fetchData() {
    MongoClient.connect(url, function(err, db) {
        db.collection('songs').find().toArray(function (error, res) {
            allDocuments = res
        })
        db.collection('settings').find().toArray(function (error, res) {
            totalTime = res[0].extractDuration
            infoDuration = res[0].infoDuration
        })
    })
    console.log('Fetching Data...')
}
fetchData()

//Broadcast music data to all client, updateDatabase (in case of change) and then broadcast the answer. Every 12s + totalTime
console.log('Starting Blindtest...')
setInterval(async function(){
    let element = selectElement(allDocuments)
    //let element = allDocuments[Math.floor(Math.random() * allDocuments.length)]
    let song = element.songs[Math.floor(Math.random() * element.songs.length)]
    
    let path = `/public/audio/${btoa(element.genre)}/${btoa(element.name)}/${btoa(song[0])}/source`
    //let serverPath = `${__dirname}/public/audio/` + element.genre + '/' + element.name + '/' + song[0] + '.mp3'
    let startTime = Number(song[1][Math.floor(Math.random() * song[1].length)])

    /*
    const getMP3Duration = require('get-mp3-duration')
    const buffer = fs.readFileSync(serverPath)
    const duration = getMP3Duration(buffer)
    if (typeof Duration !== 'undefined') {
        console.log(duration)
    } else {
        console.log('Error while calculating duration')
    }
    */
    
    io.emit('broadcast', [element.genre, path, startTime, totalTime, infoDuration])
    fetchData()
    await sleep(4000 + totalTime * 1000)
    console.log(`New song played: ${element.name} - ${song[0]}`)
    io.emit('broadcast', [element.name, song[0], infoDuration])
}, 500 + totalTime * 1000 + infoDuration * 2 * 1000);

/*
io.on('connection', socket => {
    socket.on('view', () => {
        socket.emit('data', allDocuments)
    })
})
*/