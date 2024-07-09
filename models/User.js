const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const userSchema = mongoose.Schema({
    email:{type: String, required: true, unique:true},
    username:{type:String},
    password:{type:String, required:true},
    databases: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Database' }]

});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);