Spaceboard
==========

Spaceboard is a near limitless whiteboarding / sketchpad webapp. Requires Dropbox account for authentication to use the Datastore API.

Made for Dropbox Hack Week 2014.

### How to run web app locally or on your own webserver ###

1. Sign into your Dropbox developer account at http://www.dropbox.com/developers/
2. Create Spaceboard app from the Dropbox
3. Add redirect_uri (HTTPS for remote apps) in the Dropbox App Console
4. Modify API_KEY in `client/main.js` to use the one assigned when you created the Spaceboard app in the web console
5. Run the index page from `client` folder and sign into your Dropbox account

### How to build for native iOS app (BROKEN) ###

1. Generate minified javascript

	$ npm install
	$ grunt

2. Compile from Xcode project `ios` folder
