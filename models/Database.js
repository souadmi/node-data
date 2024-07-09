const mongoose = require('mongoose');

const databaseSchema = mongoose.Schema({
    type: { type: String, required: true },
    url: { type: String, required: true },
    user: { type: String },
    password: { type: String }
});

module.exports = mongoose.model('Database', databaseSchema);