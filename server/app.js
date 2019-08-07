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
app.get('*', (req, res) => {
    let url = req.params[0]
    if (url === '/') {
        const file = `${__dirname}/public/home.html`;
        res.sendFile(file, (err) => {
            if (err) {
                //res.sendFile(`${__dirname}/public/error.html`)
            }
        })
    } else if (url.startsWith('/public/audio')) {
        let data = url.split('/')
        const file = `${__dirname}/public/audio/${atob(data[3])}/${atob(data[4])}/${atob(data[5])}.mp3`;
        res.sendFile(file, (err) => {
            if (err) {
                //res.sendFile(`${__dirname}/public/error.html`)
            }
        })
    } else {
        const file = `${__dirname}${req.originalUrl}`;
        res.sendFile(file, (err) => {
            if (err) {
                res.sendFile(`${__dirname}/public/error.html`)
            }
        })
    }
})

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
let element
let song

function arrayInsert(array, index, element) {
    return array.splice(index, 0, element)
}

function selectElement(data) {
    console.log('Selecting song...')
    return (data[Math.floor(Math.random() * data.length)])
}

function fetchData() {
    console.log('Fetching Data...')
    MongoClient.connect(url, function(err, db) {
        db.collection('songs').find().toArray(function (error, res) {
            allDocuments = res
            element = selectElement(allDocuments)
            song = element.songs[Math.floor(Math.random() * element.songs.length)]
            while ((lastElements.indexOf(element.name) < (allDocuments.length / 2)) && ((lastElements.indexOf(element.name) > -1))) {
                console.log(`Song already used in the last ${allDocuments.length / 2} songs, selecting a new song`)
                element = selectElement(allDocuments)
                song = element.songs[Math.floor(Math.random() * element.songs.length)]
            }
            arrayInsert(lastElements, 0, element.name)
        })
        db.collection('settings').find().toArray(function (error, res) {
            totalTime = res[0].extractDuration
            infoDuration = res[0].infoDuration
        })
    })
}
fetchData()

//Broadcast music data to all client, updateDatabase (in case of change) and then broadcast the answer. Every 12s + totalTime
console.log('Starting Blindtest...')
setInterval(async function(){
    //let element = allDocuments[Math.floor(Math.random() * allDocuments.length)]
    let path = `/public/audio/${btoa(element.genre)}/${btoa(element.name)}/${btoa(song[0])}/source`
    //let serverPath = `${__dirname}/public/audio/` + element.genre + '/' + element.name + '/' + song[0] + '.mp3'
    let startTime = Number(song[1][Math.floor(Math.random() * song[1].length)])

    /*
    const getMP3Duration = require('get-mp3-duration')
    const buffer = fs.readFileSync(serverPath)
    const duration = getMP3Duration(buffer)
    */
    
    let answer = [element.name, song[0], infoDuration]
    fetchData()
    io.emit('broadcast', [element.genre, path, startTime, totalTime, infoDuration])
    await sleep(2000 + totalTime * 1000)
    console.log(`New song played: ${answer[0]} - ${answer[1]}`)
    io.emit('broadcast', answer)
}, totalTime * 1000 + infoDuration * 2 * 1000 - 2500);

/*
io.on('connection', socket => {
    socket.on('view', () => {
        socket.emit('data', allDocuments)
    })
})
*/

//`http://localhost/public/audio/${btoa("Anime")}/${btoa("Aldnoah.Zero")}/${btoa("aLIEz")}/source`