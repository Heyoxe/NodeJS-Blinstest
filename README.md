# NodeJS-Blinstest
Online multiplayer Blindtest app made wiht NodeJS
Create a file named `mongodb.txt` in `server` and put the URI to the Database inside.
## Dependecies
- atob: https://www.npmjs.com/package/atob
- btoa: https://www.npmjs.com/package/btoa
- Socket.io: https://www.npmjs.com/package/socket.io
- ExpressJS: https://www.npmjs.com/package/express
- IP: https://www.npmjs.com/package/ip
- MongoDB: https://www.npmjs.com/package/mongodb
- GetMP3Duration: https://www.npmjs.com/package/get-mp3-duration

## Database Structure
- DATABSE
  - songs (collection)
    - OBJECT
      - genre (string)
      - name (string)
      - songs (aray)
        -n (array)
          - 0 [Name] (name)
          - 1 [StartCodes] (array)
            - n [startCode in Seconds] (number)
  - settings (collection)
    - OBJECT
      - extractDuration (number) [in seconds]
      - infoDuration (number) [in seconds]
      
## Server structure
- SERVER
  - /server
    - /public
      - /audio
        - GENRE
          - DATABASE.SONGS[OBJECT].NAME
            - DATABASE.SONGS[OBJECT].SONGS (n times)
      - home.html
      - error.html
    - app.js
