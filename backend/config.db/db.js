const mongoose = require('mongoose');

async function connect(uri) {
  return mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
}

module.exports = { connect };
