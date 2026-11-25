const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '8h';

function generateToken(payload) {
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
    return token;
}

// Devuelve { payload } si el token es válido, o { payload: null, vencido } si no lo es, para que
// el middleware pueda decir "la sesión venció" en lugar de "token inválido" (#26).
function verifyToken(token) {
    try {
        return { payload: jwt.verify(token, JWT_SECRET), vencido: false };
    } catch (error) {
        return { payload: null, vencido: error.name === 'TokenExpiredError' };
    }
}

module.exports = {
    generateToken,
    verifyToken
};
