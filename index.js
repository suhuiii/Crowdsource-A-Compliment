'use strict';

const Alexa = require('alexa-sdk');
var Twitter = require('twitter-node-client').Twitter;

var config = {
    "consumerKey": "*removed*",
    "consumerSecret": "*removed*",
    "accessToken": "*removed*",
    "accessTokenSecret": "*removed*",
    "callBackUrl": "None"
}

var twitter = new Twitter(config);


const APP_ID = "amzn1.ask.skill.c1bee493-7811-4f45-b476-de45066bde13";

var positiveAdjectives = ["awesome", "adaptable", "adventurous", "affectionate",
    "ambitious", "amiable", "amusing", "brave", "compassionate", "considerate",
    "courageous", "courteous", "creative", "dynamic", "energetic",
    "enthusiastic", "fearless", "frank", "friendly", "funny", "generous", "gregarious",
    "independent", "intelligent", "intuitive", "inventive", "kind", "loving",
    "passionate", "persistent", "patient", "practical", "romantic",
    "reliable", "resourceful", "sensible", "sincere", "sociable",
    "sympathetic", "thoughtful", "unassuming", "warmhearted", "witty"]

const handlers = {
    'LaunchRequest': function () {
        this.emit('GetSomethingNice');
    },
    'GetSomethingNiceIntent': function () {
        this.attributes['name'] = this.event.request.intent.slots.Name.value;
        this.emit('GetSomethingNice');
    },
    'GetSomethingNice': function () {
        var self = this;
        const adjIndex = Math.floor(Math.random() * positiveAdjectives.length);
        this.attributes['descriptor'] = positiveAdjectives[adjIndex];

        if (!this.attributes['name']) {
            this.attributes['name'] = "You";
            this.attributes['descriptor'] = "are ".concat(this.attributes['descriptor']);
        } else {
            this.attributes['descriptor'] = "is ".concat(this.attributes['descriptor']);
        }
        console.log(this.attributes['descriptor'])
        var speechOutput = this.attributes['name'] + this.attributes['descriptor'];


        twitter.getSearch({ 'q': "%22" + this.attributes['descriptor'] + "%22", 'result_type': 'mixed', 'count': 15 },
            function () { this.emit('Unhandled'); },
            function (data) {
                var j_data = JSON.parse(data)
                var statuses = j_data["statuses"];

                while (true) {

                    const randIndex = Math.floor(Math.random() * statuses.length);
                    var randTweet = statuses[randIndex].text;

                    randTweet = randTweet.replace(/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-‌​9+&@#\/%=~_|])/gi, " ");

                    randTweet = randTweet.replace(/\s?&amp;\s?/gi, " and ");
                    randTweet = randTweet.replace(/([,.!?+&;*]+)([^\s\d])/g, "$1 ");
                    randTweet = randTweet.replace(/\.?\s[\t\n]/gi, ". ");

                    var indexOfSearch = randTweet.search(self.attributes['descriptor']);

                    if (indexOfSearch != -1 && indexOfSearch + self.attributes['descriptor'].length + 2 <= randTweet.length) {

                        if (statuses[randIndex].entities.user_mentions) {
                            randTweet = randTweet.replace(/[^(with)](\s(?:@\w+))+[^(?:@\w+)]*$/ig, "");
                        }

                        if (statuses[randIndex].entities.hashtags) {
                            randTweet = randTweet.replace(/#/gi, " hashtag ");
                        }

                        randTweet = randTweet.replace(/\s?[^\x20-\x7E]+/g, ' ').trim();

                        speechOutput = self.attributes['name'] + " " + randTweet.slice(randTweet.search(self.attributes['descriptor']));

                        if (self.attributes['name'] == "You") {
                            var cardTitle = "Your compliment is..."
                        } else {
                            var cardTitle = "Your compliment about " + self.attributes['name'] + " is..."
                        }

                        console.log(speechOutput);

                        self.emit(':tellWithCard', speechOutput, cardTitle, speechOutput + "\n Original tweet: \n" + statuses[randIndex].text);
                        return
                    }
                }
            });


    },
    'AMAZON.HelpIntent': function () {
        this.emit(':ask', "ask me to tell you something nice about a person!", "try saying tell me something nice about Bob");
    },
    'Unhandled': function () {
        this.emit(':ask', 'Sorry, I didn\'t get that.')
    }
};

exports.handler = (event, context) => {
    const alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;

    alexa.registerHandlers(handlers);
    alexa.execute();
};


