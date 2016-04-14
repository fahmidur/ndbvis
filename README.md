# NDBVIS

A simplistic web-based database query tool with a backend in NodeJS.
The trial version of DBVisualizer prevents you from creating new tabs,
and so this project is the result of much frustration.

## Key Features

* Currently only supports Postgres
* Cntrl+Enter to Execute the query
* Auto-capitalizes SQL Keywords - useful for copy-pasting out of the editor
* Web-based - works on any device with a browser
* Fluid, mobile-first, built on Bootstrap - works well on mobile
* Saves state to LocalStore, open tabs are preserved on the same browser

## Installation
* Install NodeJS
* Download this repository
* Create a databases.json (see example-databases.json)
* Run: npm install
* Run: node ndbvis.js

## TODO
* Rewrite backend in Go-lang - users shouldn't have to install NodeJS
* Support a few other DBs like MySQL and SQLite
