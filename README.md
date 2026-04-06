# New best link shortener

If all goes well: ~~https://ads.cash/~~ https://159.cash/
<br>
<br>
# Installation
- Requires: MongoDB (incl mongosh), NodeJS, NPM
- Run npm i
- Configure .env (required fields: PORT, URI (mongodb), SESSION_SECRET, ADMIN_EMAIL, ADMIN_USER, BREVO_USER, BREVO_PASS)
- Convert MongoDB to replica set
    - Locate mongod.conf & add<br>
        &nbsp;&nbsp;&nbsp;&nbsp;`replication: replSetName: "rs0"`
    - Run<br>
        &nbsp;&nbsp;&nbsp;&nbsp;`mongosh`<br>
        &nbsp;&nbsp;&nbsp;&nbsp;`db.serverCmdLineOpts().parsed.storage.dbPath`<br>
        &nbsp;&nbsp;&nbsp;&nbsp;`net stop MongoDB`<br>
        &nbsp;&nbsp;&nbsp;&nbsp;`mongod --dbpath "{db.serverCmd...}" --replSet rs0`<br>
        &nbsp;&nbsp;&nbsp;&nbsp;`mongosh`<br>
        &nbsp;&nbsp;&nbsp;&nbsp;`rs.initiate()`
<br>
<br>
# Pushing to production
- `git pull`
- `npm i`
- `pm2 reload money`
- clear old error logs (`sudo cat /dev/null > /home/savier/.pm2/logs/money-error.log`)