const OpenTok = require('opentok');

export async function startOpenTokSession() {
  const opentok = new OpenTok(process.env.openTokApiKey, process.env.openTokSecret);
  return new Promise((resolve, reject) => {
    opentok.createSession({mediaMode: 'routed'}, function (err, session) {
      if (err) {
        reject(err);
      }
      resolve({
        apiKey: process.env.openTokApiKey,
        sessionId: session.sessionId
      });
    });
  }).catch(err => {
    throw err;
  });
}

export function generateOpenTokToken(sessionId) {
  const opentok = new OpenTok(process.env.openTokApiKey, process.env.openTokSecret);
  return opentok.generateToken(sessionId);
}
