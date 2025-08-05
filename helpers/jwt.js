const { expressjwt: jwt } = require("express-jwt");

function authJwt() {
  const secret = process.env.secret;

  return jwt({
    secret,
    algorithms: ["HS256"],
    getToken: (req) => {
      if (req.cookies && req.cookies.token) {
        return req.cookies.token;
      }
      return null;
    },
  }).unless({
    path: [
      { url: /\/api\/products(.*)/, methods: ["GET", "OPTIONS"] },
      { url: /\/api\/categories(.*)/, methods: ["GET", "OPTIONS"] },
      { url: /\/public\/uploads(.*)/, methods: ["GET", "OPTIONS"] },
      { url: /\/api\/users\/login/, methods: ["POST", "OPTIONS"] },
      { url: /\/api\/users\/register/, methods: ["POST", "OPTIONS"] },
      { url: /\/api\/users\/logout/, methods: ["POST", "OPTIONS"] },
    ],
  });
}

module.exports = authJwt;
