# NDBVIS

A simplistic web-based database query tool with a backend in NodeJS.
The trial version of DBVisualizer prevents you from creating new tabs,
and so this project is the result of much frustration.

![The SQL Editor](https://raw.githubusercontent.com/fahmidur/ndbvis/master/screenshots/ss001.png)

### Key Features

* Currently only supports Postgres
* Cntrl+Enter to Execute the query
* Auto-capitalizes SQL Keywords - useful for copy-pasting out of the editor
* Web-based - works on any device with a browser
* Fluid, mobile-first, built on Bootstrap - works well on mobile
* Saves state to LocalStore, open tabs are preserved on the same browser

### Installation
* Install NodeJS
* Download this repository
* Create a databases.json (see example-databases.json)
* Run: npm install
* Edit config.json
  * Choose an admin username/password (defaults to admin/d3faultpassw0rd)
  * Choose a port
  * Choose a bind address (defaults to 0.0.0.0)
  * Choose an x509 cert and private key (or use self-signed as instructed below)
* Run ./gencert to create a self-signed certificate if you did not choose a cert and key
* Run: node ndbvis.js

You may run ndbvis.js with an option to overwrite the config.json path.
Example:
```
node ndbvis.js --config /path/to/custom/config.json
```


### TODO Subset
* Rewrite backend in Go-lang - users shouldn't have to install NodeJS
* Support a few other DBs like MySQL and SQLite

### More Screenshots

![Record Display Window](https://raw.githubusercontent.com/fahmidur/ndbvis/master/screenshots/ss002.png)
![Sign-In Page](https://raw.githubusercontent.com/fahmidur/ndbvis/master/screenshots/ss003.png)