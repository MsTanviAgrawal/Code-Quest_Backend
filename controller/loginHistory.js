import LoginHistory from '../models/LoginHistory.js';

// Get login history for a user
export const getLoginHistory = async (req, res) => {
    const { userId } = req.params;

    try {
        const history = await LoginHistory.find({ userId })
            .sort({ loginTime: -1 }) // Most recent first
            .limit(50) // Limit to last 50 logins
            .select('-__v'); // Exclude version field

        res.status(200).json({
            success: true,
            count: history.length,
            data: history
        });
    } catch (error) {
        console.error('Error fetching login history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch login history',
            error: error.message
        });
    }
};

// Get recent login history (last 10 logins)
export const getRecentLogins = async (req, res) => {
    const { userId } = req.params;

    try {
        const recentLogins = await LoginHistory.find({ userId })
            .sort({ loginTime: -1 })
            .limit(10)
            .select('browser os deviceType ipAddress loginTime loginMethod requireOtp success');

        res.status(200).json({
            success: true,
            data: recentLogins
        });
    } catch (error) {
        console.error('Error fetching recent logins:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch recent logins',
            error: error.message
        });
    }
};

// Get login statistics for a user
export const getLoginStats = async (req, res) => {
    const { userId } = req.params;

    try {
        const totalLogins = await LoginHistory.countDocuments({ userId, success: true });
        const failedLogins = await LoginHistory.countDocuments({ userId, success: false });
        
        // Get unique devices used
        const devices = await LoginHistory.distinct('deviceType', { userId });
        
        // Get unique browsers used
        const browsers = await LoginHistory.distinct('browser', { userId });
        
        // Get most recent login
        const lastLogin = await LoginHistory.findOne({ userId, success: true })
            .sort({ loginTime: -1 })
            .select('browser os deviceType ipAddress loginTime');

        res.status(200).json({
            success: true,
            stats: {
                totalLogins,
                failedLogins,
                uniqueDevices: devices.length,
                devicesUsed: devices,
                browsersUsed: browsers,
                lastLogin
            }
        });
    } catch (error) {
        console.error('Error fetching login stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch login statistics',
            error: error.message
        });
    }
};
