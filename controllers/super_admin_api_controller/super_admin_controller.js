require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Simulated database user (for demo purposes)
const superAdmin = {
    email: 'superAdmin@room.com',
    password: 'super123admin890@Room', // Plain text password, will hash later
};

// Hash the password once and store it securely
const hashedPassword = bcrypt.hashSync(superAdmin.password, 10);

// Secret key for JWT (In production, store this in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret'; // Default for development

class SuperAdminController {
    static async login(req, res) {
        const { email, password } = req.body;

        try {
            // Validate email
            if (email !== superAdmin.email) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized: Invalid email',
                });
            }

            // Validate password
            const isMatch = await bcrypt.compare(password, hashedPassword);
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized: Invalid password',
                });
            }

            // Generate JWT with the secret from the environment variable
            const token = jwt.sign({ email: superAdmin.email }, JWT_SECRET, { expiresIn: '1h' });
            return res.status(200).json({
                success: true,
                data: token,
                message: "Successfully logged in",
            });
        } catch (error) {
            console.error('Login error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
            });
        }
    }

    static verifyToken(req, res, next) {
        const token = req.headers['authorization'];

        if (!token) {
            return res.status(403).json({
                success: false,
                message: 'No token provided',
            });
        }

        // Verify JWT using the secret from the environment variable
        jwt.verify(token.split(' ')[1], JWT_SECRET, (err, decoded) => {
            if (err) {
                console.error('Token verification error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to authenticate token',
                });
            }

            req.user = decoded; // Store the decoded token information for later use
            next();
        });
    }
}

module.exports = SuperAdminController;
