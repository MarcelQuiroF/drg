const jwt = require('jsonwebtoken');


const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRATION = process.env.JWT_EXPIRATION ;


function generateToken(payload) {
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
    return token;
}

function verifyToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded;
    } catch (error) {
        return null;
    }
}

module.exports = {
    generateToken,
    verifyToken
};