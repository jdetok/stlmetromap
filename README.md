# stl-transit
### <i>IN EARLY DEVELOPMENT</i>
Interactive Map of multi-modal transportation options in the St. Louis Metropolitan Statistical Area. Powered by the ESRI ArcGIS Maps SDK for JavaScript. Users can explore relationships between transit access and various dependent variables. For more details, see the [scope](/z_docs/SCOPE.md) document
- Repo organization details are explained in the [repo](/z_docs/REPO.md) document
- High level technical details can be found in the [stack](/z_docs/STACK.md) document

## Latest working example: 
<img src="z_docs/img/working.png" alt="screenshot of the project homepage" style="max-height:60vh;">

## HOW TO RUN LOCALLY
The two main components are a Go backend and a Typescript frontend. The app can be run fully locally with a 1.25+ install of Go, or from the docker compose file. 
- #### First, clone the repo and enter the stl-transit directory:
    `git clone https://github.com/jdetok/stl-transit`<br>
    `cd stl-transit`
    - #### From compose.yaml (recommended):
        1. ensure [docker](https://www.docker.com/products/docker-desktop/) is installed 
        1. build and run the [docker compose file](./compose.yaml):<br>
        `docker compose up --build`
        1. app should be running at http://localhost:3333
    - #### Fully local (no docker):
        1. ensure local versions of Go (1.26+) and npm (11.9.0+) are installed
        1. from project root directory, run the following commands to install all dependencies 
        <br> `go mod download`<br>`npm i`
        1. transprile and bundle frontend:<br>`npm run dev`
        1. run Go backend: <br>`go run ./src`
        1. app should be running at http://localhost:9999
* NOTICE: the app is accessible from the browser on different ports depending on how it is run - 3333 for docker and 9999 for fully local