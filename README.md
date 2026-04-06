# New best link shortener

If all goes well: ~~https://ads.cash/~~ https://159.cash/
<br>
<br>
# Installation
- Requires: MongoDB (incl mongosh), NodeJS, NPM
- Run npm i
- Configure .env (required fields: PORT, URI (mongodb), SESSION_SECRET, ADMIN_EMAIL, ADMIN_USER, BREVO_USER, BREVO_PASS)
- Convert MongoDB to replica set
    Locate mongod.conf & add
        replication:
            replSetName: "rs0"
    Run
        mongosh
        db.serverCmdLineOpts().parsed.storage.dbPath
        net stop MongoDB
        mongod --dbpath "{db.serverCmd...}" --replSet rs0
        mongosh
        rs.initiate()