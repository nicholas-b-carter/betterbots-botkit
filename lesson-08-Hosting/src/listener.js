import Botkit from 'botkit';
import alexa from 'alexa-botkit';
import localtunnel from 'localtunnel';
import { uTu, constants } from 'utu';

// tag utu constants to app environment
const utu = new uTu(process.env.UTU_SECRET, {
  platform: constants.ALEXA,
  appId: process.env.ALEXA_APPID,
});

// define ears for Alexa
const ears = alexa({
  debug: true,
});

// give alexa the tools to listen and communicate to the outside world
const earBuds = ears.spawn({});

// start listening to your Alexa ears!
ears.setupWebserver(process.env.PORT, (err, webserver) => {
  ears.createWebhookEndpoints(webserver, earBuds, () => {
      console.log(`ONLINE! ${process.env.PORT}`);
  });
});

// creating a middleware that adds the utu context to each incoming request
ears.middleware.receive.use((bot, message, next) => {
  // instrament each message to have utu within the scope of each incoming message
  message.utu = utu.withContext(
    {
      platformId: message.user,
      sessionId: message.alexa.getSessionId(),
    }
  );

  // on any message that comes through send the message to utu
  message.utu.message({
    values: {
      message: message.alexa.getIntentName(),
      rawMessage: message.alexa,
      botMessage: false,
    }
  });

  next();
});

ears.middleware.send.use(function(bot, message, next) {
  // on any outgoing message log the message being sent back to the user
  message.src.utu.message({
    values: {
      message: message.resp.state.response.outputSpeech.text,
      rawMessage: message.resp,
      botMessage: true,
    }
  });
  next();
});

export default ears;
